import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ToolUsage } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UsageChartProps {
  data: ToolUsage[];
  type?: 'line' | 'bar';
  title: string;
  className?: string;
}

const UsageChart: React.FC<UsageChartProps> = ({ 
  data, 
  type = 'line',
  title,
  className 
}) => {
  const colors = [
    'rgba(59, 130, 246, 0.5)', // blue
    'rgba(124, 58, 237, 0.5)', // purple
    'rgba(16, 185, 129, 0.5)', // green
    'rgba(239, 68, 68, 0.5)',  // red
    'rgba(245, 158, 11, 0.5)', // amber
  ];

  // All dates from all tools
  const allDates = data.flatMap(tool => tool.usageData.map(d => d.date));
  // Unique sorted dates
  const labels = [...new Set(allDates)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const datasets = data.map((tool, index) => {
    // Create a map of date to count for easier lookup
    const dateCountMap = new Map(tool.usageData.map(d => [d.date, d.count]));
    
    // For each label (date), get the count or 0 if not present
    const counts = labels.map(date => dateCountMap.get(date) || 0);
    
    return {
      label: tool.toolName,
      data: counts,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.5', '1'),
      borderWidth: 2,
      tension: 0.4,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {type === 'line' ? (
            <Line data={chartData} options={options} />
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageChart;