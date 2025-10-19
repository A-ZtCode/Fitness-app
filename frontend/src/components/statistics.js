import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './statistics.css';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';


// Utility function to convert total minutes to hours and minutes
const toHoursAndMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
};


// Custom Tooltip Component for Donut Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataEntry = payload[0];
    const durationInMin = dataEntry.value;
    const durationFormatted = toHoursAndMinutes(durationInMin);
    const exerciseName = dataEntry.name;
    const color = dataEntry.color;

    return (
      <div className="custom-tooltip">
        <p className="label" style={{ color: color, fontWeight: 'bold' }}>
          {exerciseName}: {durationFormatted}
        </p>
        {/* <p className="intro">Total: {durationInMin} min</p> */}
      </div>
    );
  }

  return null;
};

// Define a simple, clean, monochromatic blue/purple palette
const ACCENT_COLOR_PRIMARY = '#5B53D0'; // Deep Blue/Violet for main elements
const ACCENT_COLOR_SECONDARY = '#ff0073'; // Vibrant Pink for highlights
const COLOR_HIGH_CONTRAST = '#FF8C00'; // Dark Orange for high contrast elements
const NEUTRAL_COLOR_LIGHT = '#E0E0E0'; // Light grey for backgrounds/neutral elements
const COLOR_DURATION = ACCENT_COLOR_PRIMARY; // Use primary for Duration

// CORRECTED CHART_COLORS for a monochromatic palette
const CHART_COLORS = [
    ACCENT_COLOR_PRIMARY,         // Primary: Deep Blue/Violet
    COLOR_HIGH_CONTRAST,         // High Contrast: Dark Orange
    ACCENT_COLOR_SECONDARY,      // Secondary: Vibrant Pink
    '#B0E0E6',                  // Tertiary: Light Powder Blue
    NEUTRAL_COLOR_LIGHT         // Light Grey
];

// Custom Legend component for the Donut Chart
const CustomDonutChartLegend = ({ payload }) => {
  return (
    <div className="donut-legend-wrapper">
      {payload.map((entry, index) => {
        const durationFormatted = toHoursAndMinutes(entry.value);
        return (
        <div key={`item-${index}`} className="donut-legend-item">
          <span className="donut-legend-color-box" style={{ backgroundColor: entry.color }}></span>
          <span className="donut-legend-name">{entry.name}</span>
          <span className="donut-legend-value">{entry.value}</span>
        </div>
      );
      })}
    </div>
  );
};


const Statistics = ({ currentUser }) => {
  const [data, setData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);

  useEffect(() => {
    let statsLoaded = false;
    let trendLoaded = false;
    
    // Function to check if all data is loaded
    const checkComplete = () => {
        if (statsLoaded && trendLoaded) {
            setLoading(false);
            setLoadingWeekly(false);
        }
    };

    // 1. Fetch Aggregated Stats (for Donut Chart and Metrics)
    const statsUrl = `http://localhost:5050/stats/${currentUser}`;
    axios.get(statsUrl)
      .then(response => {
        const currentUserStats = response.data.stats.find(item => item.username === currentUser);
        setData(currentUserStats);
      })
      .catch(error => {
        console.error('There was an error fetching aggregated stats:', error);
      })
      .finally(() => {
        statsLoaded = true;
        checkComplete();
      });

// 2. Fetch Weekly Trend Data (for Line Chart)
    const trendUrl = `http://localhost:5050/stats/daily_trend/${currentUser}`;
    axios.get(trendUrl)
        .then(response => {
            setWeeklyData(response.data.trend);
        })
        .catch(error => {
            console.error('Error fetching weekly trend:', error);
        })
        .finally(() => {
            trendLoaded = true;
            checkComplete();
        });

  }, [currentUser]);
  
if (loading || loadingWeekly) {
    return <div className="stats-container"><p>Loading statistics...</p></div>;
  }

  const exerciseData = data ? data.exercises : [];
  
  const totalDuration = exerciseData.reduce((sum, item) => sum + item.totalDuration, 0);
  const totalDurationFormatted = toHoursAndMinutes(totalDuration);
  const totalExerciseTypes = exerciseData.length;

  const distributionData = exerciseData.map(item => ({
    name: item.exerciseType,
    value: item.totalDuration,
  }));

  // Find the top exercise
  const topExercise = distributionData.length > 0 
    ? distributionData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : { name: 'N/A', value: 0 };
  
  const topExerciseDurationFormatted = toHoursAndMinutes(topExercise.value);


  return (
    <div className="stats-container">
      <h2>Your Fitness Dashboard, {currentUser}! 🚀</h2>

      {exerciseData.length === 0 ? (
        <p className="no-data-message">No exercise data available to display statistics.</p>
      ) : (
        <>
          <div className="stats-header-cards">
            {/* Card 1: clear text colors for visibility */}
            <div className="stat-card primary-bg">
              <h3>Total Active Time</h3>
              <p>{totalDurationFormatted}</p>
            </div>
            {/* Card 2: clear text colors for visibility */}
            <div className="stat-card secondary-bg">
              <h3>Total Number of Exercises</h3>
              <p>{totalExerciseTypes}</p>
            </div>
            {/* Card 3: styling with dark text and primary accent for value */}
            <div className="stat-card accent-bg">
              <h3>Top Exercise</h3>
              <p>{topExercise.name} <span style={{fontSize: '0.6em', opacity: 0.8, fontWeight: 400}}>({topExerciseDurationFormatted})</span></p>
            </div>
          </div>

          <div className="charts-grid">
            {/* Weekly Activity Trend (Line Chart) */}
            <div className="chart-card wide-chart">
              <h3>Total Weekly Activity Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={NEUTRAL_COLOR_LIGHT} />
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis stroke="#555" />

                <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Active Time' && typeof value === 'number') {
                    return toHoursAndMinutes(value);
                  }
                  return value;
                }}
              />

              <Legend wrapperStyle={{ paddingTop: '10px' }}/>

                {/* Solid primary line for Duration */}
                <Line
                  type="monotone"
                  dataKey="Duration"
                  name="Active Time"
                  stroke={COLOR_DURATION}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Exercise Distribution (Donut Chart) */}
            <div className="chart-card small-chart">
              <h3>Duration by Exercise Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30} 
                    outerRadius={50} 
                    fill={ACCENT_COLOR_PRIMARY}
                    // paddingAngle={3} 
                    labelLine={false} 
                    
                    
                    
                    label={({ 
                        cx, cy, midAngle, innerRadius, outerRadius, value, percent, index 
                    }) => {
                        // Calculate position for external label (pushed slightly out)
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)) * 1.45;
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)) * 1.45;

                        // Return text element for the label
                        return (
                            <text 
                                x={x} 
                                y={y} 
                                fill="#333" 
                                textAnchor={x > cx ? 'start' : 'end'} 
                                dominantBaseline="central"
                                style={{fontSize: '12px'}}
                            >
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  
                  {/*Add 'cursor={{ stroke: 'none' }}' to prevent the tooltip from highlighting the whole chart area */}
                  <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ fill: 'transparent' }} // Prevents dark overlay on hover
                  />
                  
                  <Legend
                    content={<CustomDonutChartLegend />} 
                    layout="vertical"
                    verticalAlign="bottom" 
                    align="center" 
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;