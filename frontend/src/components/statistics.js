import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './statistics.css';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Mock data for the Line Chart
const mockWeeklyActivityData = [
    { name: 'Mon', Duration: 60, Calories: 500 },
    { name: 'Tue', Duration: 45, Calories: 400 },
    { name: 'Wed', Duration: 75, Calories: 650 },
    { name: 'Thu', Duration: 50, Calories: 480 },
    { name: 'Fri', Duration: 90, Calories: 800 },
    { name: 'Sat', Duration: 120, Calories: 1100 },
    { name: 'Sun', Duration: 30, Calories: 250 },
];

// Define a simple, clean, monochromatic blue/purple palette
const ACCENT_COLOR_PRIMARY = '#5B53D0'; // Deep Blue/Violet for main elements
const ACCENT_COLOR_SECONDARY = '#A39EF8'; // Lighter Violet for secondary elements
const NEUTRAL_COLOR_LIGHT = '#E0E0E0'; // Light grey for backgrounds/neutral elements

// CORRECTED CHART_COLORS for a monochromatic palette
const CHART_COLORS = [
    ACCENT_COLOR_PRIMARY,          // Deepest Blue for largest slice
    ACCENT_COLOR_SECONDARY,        // Lighter Blue/Violet
    '#D7D4F7',                     // Even lighter violet
    NEUTRAL_COLOR_LIGHT            // A very light grey/violet for smallest slices or background
];


// Custom Legend component for the Donut Chart
const CustomDonutChartLegend = ({ payload }) => {
  return (
    <div className="donut-legend-wrapper">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="donut-legend-item">
          <span className="donut-legend-color-box" style={{ backgroundColor: entry.color }}></span>
          <span className="donut-legend-name">{entry.name}</span>
          <span className="donut-legend-value">{entry.value} min</span>
        </div>
      ))}
    </div>
  );
};


const Statistics = ({ currentUser }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `http://localhost:5050/stats/${currentUser}`;
    axios.get(url)
      .then(response => {
        const currentUserStats = response.data.stats.find(item => item.username === currentUser);
        setData(currentUserStats);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser]);


  if (loading) {
    return <div className="stats-container"><p>Loading statistics...</p></div>;
  }

  const exerciseData = data ? data.exercises : [];
  
  const totalDuration = exerciseData.reduce((sum, item) => sum + item.totalDuration, 0);
  const totalExerciseTypes = exerciseData.length;

  const distributionData = exerciseData.map(item => ({
    name: item.exerciseType,
    value: item.totalDuration,
  }));

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
              <h3>Total Duration</h3>
              <p>{totalDuration} min</p>
            </div>
            {/* Card 2: clear text colors for visibility */}
            <div className="stat-card secondary-bg">
              <h3>Total Exercise Types</h3>
              <p>{totalExerciseTypes}</p>
            </div>
            {/* Card 3: styling with dark text and primary accent for value */}
            <div className="stat-card accent-bg">
              <h3>Avg. Daily Calories (Mock)</h3>
              <p>450 kcal</p>
            </div>
          </div>

          <div className="charts-grid">
            {/* Weekly Activity Trend (Line Chart) */}
            <div className="chart-card wide-chart">
              <h3>Weekly Activity Trend (Time in min)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockWeeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={NEUTRAL_COLOR_LIGHT} /> {/* Use NEUTRAL_COLOR_LIGHT here */}
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip />
                  <Line type="monotone" dataKey="Duration" stroke={ACCENT_COLOR_PRIMARY} strokeWidth={3} />
                  <Line type="monotone" dataKey="Calories" stroke={ACCENT_COLOR_SECONDARY} strokeWidth={3} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }}/>
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
                    innerRadius={40} 
                    outerRadius={60} 
                    fill={ACCENT_COLOR_PRIMARY}
                    // paddingAngle={3} 
                    labelLine={false} // Hide the line connecting labels
                    
                    
                    // Use the built-in label component which calculates optimal positions
                    label={({ 
                        cx, cy, midAngle, innerRadius, outerRadius, value, percent, index 
                    }) => {
                        // Calculate position for external label (pushed slightly out)
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)) * 1.5;
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)) * 1.5;

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
                      formatter={(value) => [`${value} min`, 'Total Duration']} 
                      cursor={{ fill: 'transparent' }} // Prevents dark overlay on hover
                  />
                  
                  <Legend
                    content={<CustomDonutChartLegend />} 
                    layout="vertical"
                    verticalAlign="bottom" 
                    align="center" 
                    wrapperStyle={{ paddingTop: '20px' }} 
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