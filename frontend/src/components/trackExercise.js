import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  FormControl,
  IconButton,
  Typography,
  Tooltip,
  MenuItem,
  Button as MuiButton,
  Select,
  TextField,
} from "@mui/material";
import {
  trackExercise,
  getCustomActivities,
  createCustomActivity,
} from "../api.js";

import "bootstrap/dist/css/bootstrap.min.css";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import TimerIcon from "@mui/icons-material/Timer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import AddIcon from "@mui/icons-material/Add";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { enGB } from "date-fns/locale";
import CustomActivityModal from "./CustomActivityModal.js";
import "./dropdown-activity-selector.css";

const TrackExercise = ({ currentUser }) => {
  const [state, setState] = useState({
    exerciseType: "",
    description: "",
    duration: 0,
    date: new Date(),
  });
  const [message, setMessage] = useState("");
  const [customActivities, setCustomActivities] = useState([]);
  const [showCustomActivityModal, setShowCustomActivityModal] = useState(false);

  // Speech to Text
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Fetch custom activities on component mount
  useEffect(() => {
    fetchCustomActivities();
  }, [currentUser]);

  const fetchCustomActivities = async () => {
    try {
      const response = await getCustomActivities(currentUser);
      setCustomActivities(response.data);
    } catch (error) {
      console.error("Error fetching custom activities:", error);
      setCustomActivities([]);
    }
  };

  const handleActivityCreated = (newActivity) => {
    setCustomActivities((prev) => [...prev, newActivity]);
    setState((prev) => ({ ...prev, exerciseType: newActivity.activityName }));
    setMessage(
      `✅ Custom activity "${newActivity.activityName}" created successfully!`
    );
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSpeechParse = async (transcript) => {
    try {
      const response = await fetch(
        "http://localhost:5051/speech_to_text_parser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const parsed = data.parsed;
      console.log("Parsed activity:", parsed);

      if (parsed) {
        if (
          !parsed.exerciseType ||
          !parsed.duration ||
          !parsed.date ||
          !parsed.description
        ) {
          alert(
            "❗ That doesn't look like a valid fitness activity or it is missing some details. Please try again."
          );
          return;
        }

        const allDefaultActivities = [];
        activityCategories.forEach((category) => {
          category.activities.forEach((activity) => {
            allDefaultActivities.push(activity.value);
          });
        });

        const customActivityNames = customActivities.map(
          (ca) => ca.activityName
        );
        const allActivities = [...allDefaultActivities, ...customActivityNames];

        const activityExists = allActivities.some(
          (activity) =>
            activity.toLowerCase() === parsed.exerciseType.toLowerCase()
        );

        if (!activityExists && parsed.exerciseType !== "Unknown") {
          try {
            console.log(
              `Auto-creating custom activity: ${parsed.exerciseType}`
            );
            setMessage(`Creating custom activity: ${parsed.exerciseType}...`);

            await createCustomActivity({
              username: currentUser,
              activityName: parsed.exerciseType,
            });

            console.log(`Successfully created: ${parsed.exerciseType}`);
            await fetchCustomActivities();
            await new Promise((resolve) => setTimeout(resolve, 200));

            setMessage(
              `✅ Created "${parsed.exerciseType}" and populated form!`
            );
          } catch (error) {
            console.error("Error auto-creating activity:", error);

            if (error.response?.data?.error?.includes("already exists")) {
              console.log("Activity already exists, continuing...");
              await fetchCustomActivities();
              setMessage(`✅ Activity "${parsed.exerciseType}" found!`);
            } else if (error.response?.data?.error?.includes("maximum")) {
              setMessage(
                `⚠️ Maximum custom activities (10) reached. Please delete one first.`
              );
              return;
            } else {
              setMessage(
                `⚠️ Could not create "${parsed.exerciseType}". Add it manually.`
              );
              return;
            }
          }
        }

        let parsedDate = null;
        if (parsed.date) {
          const parts = parsed.date.split("/");
          const year = parseInt(parts[0]);
          const monthIndex = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          parsedDate = new Date(year, monthIndex, day, 3, 0, 0);
        } else {
          parsedDate = new Date();
        }

        setState((prev) => ({
          ...prev,
          exerciseType: parsed.exerciseType || prev.exerciseType,
          duration: parsed.duration || prev.duration,
          description: parsed.description || prev.description,
          date: parsedDate || prev.date,
        }));

        if (activityExists) {
          setMessage(`✅ Parsed from speech: ${parsed.exerciseType}`);
        }
      } else {
        alert("❗ Could not parse activity. Please try again.");
      }
    } catch (err) {
      console.error("Parsing failed:", err);
      setMessage("❌ Speech parsing failed. Please try again.");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + text + " ");
        } else {
          interimTranscript += text;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      if (transcript.trim().length !== 0) {
        handleSpeechParse(transcript);
      }
    } else {
      setTranscript("");
      recognition.start();
      setListening(true);
    }
  };

  // Timer state
  const [timerMode, setTimerMode] = useState("manual");
  const [timerState, setTimerState] = useState("stopped");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const intervalRef = useRef(null);
  // Timer functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        const newSeconds = prev + 1;
        setDisplayTime(formatTime(newSeconds));
        return newSeconds;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerState("paused");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const stopTimer = () => {
    setTimerState("stopped");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const durationInMinutes = Math.round(timerSeconds / 60);
    setState((prev) => ({ ...prev, duration: durationInMinutes }));
  };

  const resetTimer = () => {
    setTimerSeconds(0);
    setDisplayTime("00:00:00");
    setTimerState("stopped");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      username: currentUser,
      ...state,
    };

    try {
      const response = await trackExercise(dataToSubmit);
      console.log(response.data);
      setMessage("✅ Exercise tracked successfully!");
      setState({
        exerciseType: "",
        description: "",
        duration: 0,
        date: new Date(),
      });
      if (timerMode === "timer") {
        resetTimer();
      }
    } catch (error) {
      console.log(error);
      setMessage("❌ Failed to track exercise. Please try again.");
    }
  };

  // Activity options organized by category
  const activityCategories = [
    {
      label: "Popular Activities",
      activities: [
        { value: "Running", label: "🏃 Running", emoji: "🏃" },
        { value: "Cycling", label: "🚴 Cycling", emoji: "🚴" },
        { value: "Swimming", label: "🏊 Swimming", emoji: "🏊" },
        { value: "Gym", label: "🏋️ Gym", emoji: "🏋️" },
        { value: "Walking", label: "🚶 Walking", emoji: "🚶" },
      ],
    },
    {
      label: "Inclusive & Accessible",
      activities: [
        {
          value: "Wheelchair Run Pace",
          label: "♿ Wheelchair Run Pace",
          emoji: "♿",
          accessible: true,
        },
        {
          value: "Wheelchair Walk Pace",
          label: "♿ Wheelchair Walk Pace",
          emoji: "♿",
          accessible: true,
        },
      ],
    },
    {
      label: "Mind & Body",
      activities: [
        { value: "Stretching", label: "🧘 Stretching", emoji: "🧘" },
        { value: "Yoga", label: "🧘 Yoga", emoji: "🧘" },
        { value: "Mind & Body", label: "🧠 Mind & Body", emoji: "🧠" },
      ],
    },
    {
      label: "Strength & Cardio",
      activities: [
        {
          value: "Functional Strength",
          label: "💪 Functional Strength",
          emoji: "💪",
        },
        { value: "Core Training", label: "🎯 Core Training", emoji: "🎯" },
        { value: "HIIT", label: "⚡ HIIT", emoji: "⚡" },
        { value: "Dance", label: "💃 Dance", emoji: "💃" },
      ],
    },
  ];
  // Get selected activity emoji for display
  const getSelectedActivityEmoji = () => {
    // Check custom activities first
    const customActivity = customActivities.find(
      (a) => a.activityName === state.exerciseType
    );
    if (customActivity) return "⭐";

    // Check default activities
    for (const category of activityCategories) {
      const activity = category.activities.find(
        (a) => a.value === state.exerciseType
      );
      if (activity) return activity.emoji;
    }
    return "";
  };

  // Tooltip Helper Renderers
  const renderMicTooltip = (props) => (
    <Tooltip id="mic-tooltip" {...props}>
      {listening ? (
        "Stop Recording and Parse Activity"
      ) : (
        <>
          Use Voice Command
          <br />
          (e.g., 'I ran 30 minutes yesterday at the park')
        </>
      )}
    </Tooltip>
  );

  const renderModeSwitchTooltip = (props) => (
    <Tooltip id="mode-switch-tooltip" {...props}>
      Switch to{" "}
      {timerMode === "manual" ? "Live Timer Mode" : "Manual Duration Entry"}
    </Tooltip>
  );

  const renderTimerTooltip = (buttonText, props) => (
    <Tooltip id="timer-tooltip" {...props}>
      {buttonText} the workout timer.
    </Tooltip>
  );

  const renderSaveTooltip = (props) => (
    <Tooltip id="save-tooltip" {...props}>
      Save the current activity.
    </Tooltip>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "var(--text-primary)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FitnessCenterIcon sx={{ fontSize: 32 }} />
          Track Exercise
        </Typography>

        <IconButton
          onClick={toggleListening}
          sx={{
            backgroundColor: listening
              ? "var(--color-error)"
              : "var(--color-primary)",
            color: "#FFFFFF",
            width: 48,
            height: 48,
            "&:hover": {
              backgroundColor: listening
                ? "#b71c1c"
                : "var(--color-primary-hover)",
            },
            transition: "all 0.3s ease",
          }}
          aria-label="Record activity with voice"
        >
          {listening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
      </Box>

      {/* Speech Textarea */}
      {listening && (
        <TextField
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your speech will appear here..."
          multiline
          rows={3}
          fullWidth
          InputProps={{
            readOnly: true,
            sx: {
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              mb: 3,
            },
          }}
        />
      )}

      {/* Form */}
      <Box component="form" onSubmit={onSubmit}>
        {/* Date Field */}
        <Box
          sx={{
            backgroundColor: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "var(--text-primary)",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Date
          </Typography>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={enGB}
          >
            <DatePicker
              value={state.date}
              onChange={(date) => setState({ ...state, date })}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  InputProps: {
                    sx: {
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    },
                  },
                },
                openPickerIcon: {
                  sx: {
                    color: "var(--text-primary)", // Makes the calendar icon visible
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        {/* Activity Selector */}
        <Box
          sx={{
            backgroundColor: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            p: 3,
            mb: 3,
          }}
        >
          <FormControl fullWidth>
            <Typography
              variant="h6"
              sx={{
                color: "var(--text-primary)",
                fontWeight: 600,
                mb: 2,
              }}
            >
              Select Activity
            </Typography>
            <Select
              value={state.exerciseType}
              onChange={(e) =>
                setState({ ...state, exerciseType: e.target.value })
              }
              displayEmpty
              required
              sx={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-medium)",
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "&:hover": {
                  borderColor: "var(--color-primary)",
                },
                "&.Mui-focused": {
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-light)",
                    maxHeight: 400,
                    "& .MuiMenuItem-root": {
                      color: "var(--text-primary)",
                      "&:hover": {
                        backgroundColor: "rgba(66, 133, 244, 0.2)",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "var(--color-primary)",
                        color: "#FFFFFF",
                        "&:hover": {
                          backgroundColor: "var(--color-primary-hover)",
                        },
                      },
                    },
                    "& .MuiListSubheader-root": {
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      backgroundColor: "var(--bg-secondary)",
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                <em
                  style={{
                    color: "var(--text-primary)",
                    fontStyle: "normal",
                    fontWeight: 500,
                  }}
                >
                  Choose an activity...
                </em>
              </MenuItem>

              {activityCategories.map((category, idx) => [
                <MenuItem
                  key={`header-${idx}`}
                  disabled
                  sx={{
                    opacity: 1,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-tertiary)",
                    fontSize: "0.875rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {category.label}
                </MenuItem>,
                ...category.activities.map((activity) => (
                  <MenuItem key={activity.value} value={activity.value}>
                    {activity.label}
                  </MenuItem>
                )),
              ])}

              {customActivities.length > 0 && [
                <MenuItem
                  key="custom-header"
                  disabled
                  sx={{
                    opacity: 1,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  My Custom Activities
                </MenuItem>,
                ...customActivities.map((activity) => (
                  <MenuItem key={activity._id} value={activity.activityName}>
                    ⭐ {activity.activityName}
                  </MenuItem>
                )),
              ]}
            </Select>
          </FormControl>

          <MuiButton
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowCustomActivityModal(true)}
            sx={{
              mt: 2,
              color: "var(--color-primary)",
              borderColor: "var(--color-primary)",
              borderWidth: "2px",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "30px",
              "&:hover": {
                borderWidth: "2px",
                backgroundColor: "var(--bg-secondary)",
              },
            }}
          >
            Add Custom Activity
          </MuiButton>

          {customActivities.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: "var(--text-muted)",
                ml: 2,
                mt: 2,
                display: "inline-block",
              }}
            >
              {customActivities.length} custom{" "}
              {customActivities.length === 1 ? "activity" : "activities"}
            </Typography>
          )}
        </Box>

        {/* Description */}
        <Box
          sx={{
            backgroundColor: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "var(--text-primary)",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Description
          </Typography>
          <TextField
            multiline
            rows={4}
            value={state.description}
            onChange={(e) =>
              setState({ ...state, description: e.target.value })
            }
            placeholder="Add details about your activity..."
            required
            fullWidth
            InputProps={{
              sx: {
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-medium)",
                "& textarea::placeholder": {
                  color: "var(--text-muted)",
                  opacity: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "&:hover": {
                  borderColor: "var(--color-primary)",
                },
                "&.Mui-focused": {
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                },
              },
            }}
          />
        </Box>

        {/* Duration */}
        <Box
          sx={{
            backgroundColor: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            p: 3,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              Duration (minutes)
            </Typography>
            <MuiButton
              variant="contained"
              startIcon={
                timerMode === "manual" ? <TimerIcon /> : <AccessTimeIcon />
              }
              onClick={() => {
                if (timerMode === "timer") stopTimer();
                setTimerMode(timerMode === "manual" ? "timer" : "manual");
              }}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "#FFFFFF",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "30px",
                boxShadow: "var(--shadow-md)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-hover)",
                },
              }}
            >
              {timerMode === "manual" ? "Live Timer" : "Manual Entry"}
            </MuiButton>
          </Box>

          {timerMode === "manual" ? (
            <TextField
              type="number"
              value={state.duration}
              onChange={(e) => setState({ ...state, duration: e.target.value })}
              placeholder="Duration in minutes"
              required
              fullWidth
              InputProps={{
                sx: {
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-medium)",
                  "& input": {
                    fontSize: "1rem",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "&:hover": {
                    borderColor: "var(--color-primary)",
                  },
                  "&.Mui-focused": {
                    borderColor: "var(--color-primary)",
                    borderWidth: "2px",
                  },
                },
              }}
            />
          ) : (
            <Box>
              <Typography
                variant="h2"
                sx={{
                  color:
                    timerState === "running"
                      ? "var(--color-primary)"
                      : "var(--text-primary)",
                  fontWeight: 700,
                  textAlign: "center",
                  my: 3,
                  fontFamily: "monospace",
                  transition: "color 0.3s ease",
                }}
              >
                {displayTime}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {(timerState === "stopped" || timerState === "paused") && (
                  <MuiButton
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={startTimer}
                    sx={{
                      backgroundColor: "var(--color-primary)",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "30px",
                      minWidth: 120,
                      "&:hover": {
                        backgroundColor: "var(--color-primary-hover)",
                      },
                    }}
                  >
                    {timerState === "stopped" ? "Start" : "Resume"}
                  </MuiButton>
                )}

                {timerState === "running" && (
                  <MuiButton
                    variant="contained"
                    startIcon={<PauseIcon />}
                    onClick={pauseTimer}
                    sx={{
                      backgroundColor: "var(--color-warning)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "30px",
                      minWidth: 120,
                      "&:hover": {
                        backgroundColor: "#c2850c",
                      },
                    }}
                  >
                    Pause
                  </MuiButton>
                )}

                {timerState !== "stopped" && (
                  <MuiButton
                    variant="contained"
                    startIcon={<StopIcon />}
                    onClick={stopTimer}
                    sx={{
                      backgroundColor: "var(--color-error)",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "30px",
                      minWidth: 120,
                      "&:hover": {
                        backgroundColor: "#b71c1c",
                      },
                    }}
                  >
                    Stop
                  </MuiButton>
                )}

                {timerState === "stopped" && timerSeconds > 0 && (
                  <MuiButton
                    variant="outlined"
                    onClick={resetTimer}
                    sx={{
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "30px",
                      minWidth: 120,
                      "&:hover": {
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-dark)",
                      },
                    }}
                  >
                    Reset
                  </MuiButton>
                )}
              </Box>
              {timerSeconds > 0 && timerState === "stopped" && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    mt: 2,
                  }}
                >
                  Logged Duration: {Math.round(timerSeconds / 60)} minutes
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Submit Button */}
        <MuiButton
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            py: 1.5,
            borderRadius: "30px",
            fontWeight: 700,
            fontSize: "1rem",
            textTransform: "none",
            backgroundColor: "var(--color-primary)",
            color: "#FFFFFF",
            boxShadow: "var(--shadow-md)",
            "&:hover": {
              backgroundColor: "var(--color-primary-hover)",
              boxShadow: "var(--shadow-lg)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Save Activity
        </MuiButton>

        {/* Success Message */}
        {message && (
          <Typography
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: message.includes("✅")
                ? "var(--color-success-bg)"
                : "var(--color-error-bg)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>

      {/* Custom Activity Modal */}
      <CustomActivityModal
        show={showCustomActivityModal}
        onHide={() => setShowCustomActivityModal(false)}
        onActivityCreated={handleActivityCreated}
        currentUser={currentUser}
      />
    </Box>
  );
};

export default TrackExercise;
