'use client'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Configure global Highcharts settings
Highcharts.setOptions({
  colors: ['#ec4899', '#3b82f6', '#eab308', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#f59e0b'],
  chart: {
    backgroundColor: 'transparent',
    style: {
      fontFamily: 'Inter, sans-serif'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadow: false
  },
  credits: {
    enabled: false
  }
})

interface ChartProps {
  type: 'pie' | 'column' | 'bar' | 'line' | 'area' | 'scatter'
  title?: string
  height?: number
  data: Array<{
    name: string
    value: number
  }>
  categories?: string[]
  yAxisTitle?: string
  showDataLabels?: boolean
  stacking?: 'normal' | 'percent'
  color?: string
  gradient?: boolean
}

export function Chart({ 
  type, 
  title, 
  height = 300, 
  data, 
  categories,
  yAxisTitle = 'Valores',
  showDataLabels = true,
  stacking,
  color,
  gradient = false
}: ChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height: `${height}px` }}>
        <div className="text-center">
          <p className="text-sm">No hay datos disponibles</p>
          <p className="text-xs mt-1">Aún no se han registrado datos para este gráfico</p>
        </div>
      </div>
    )
  }
  const getSeriesData = () => {
    if (type === 'pie') {
      return data.map(item => ({
        name: item.name,
        y: item.value
      }))
    }
    return data.map(item => item.value)
  }

  const getPlotOptions = () => {
    const baseColor = color || '#3b82f6'
    
    switch (type) {
      case 'pie':
        return {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: showDataLabels,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %'
            }
          }
        }
      case 'area':
        return {
          area: {
            stacking,
            lineColor: baseColor,
            lineWidth: 2,
            marker: {
              lineWidth: 1,
              lineColor: baseColor
            },
            fillColor: gradient ? {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, baseColor],
                [1, baseColor + '20'] // Add transparency
              ]
            } : baseColor
          }
        }
      case 'column':
        return {
          column: {
            pointPadding: 0.2,
            borderWidth: 0,
            color: baseColor,
            dataLabels: {
              enabled: showDataLabels
            }
          }
        }
      case 'bar':
        return {
          bar: {
            dataLabels: {
              enabled: showDataLabels
            },
            color: baseColor
          }
        }
      default:
        return {
          series: {
            color: baseColor,
            dataLabels: {
              enabled: showDataLabels
            }
          }
        }
    }
  }

  const options: Highcharts.Options = {
    chart: {
      type,
      height
    },
    title: {
      text: title || undefined
    },
    xAxis: categories ? {
      categories,
      crosshair: true,
      title: {
        text: undefined
      }
    } : undefined,
    yAxis: {
      min: 0,
      title: {
        text: yAxisTitle
      }
    },
    plotOptions: getPlotOptions() as any,
    series: [{
      type,
      name: title || 'Datos',
      data: getSeriesData(),
      colorByPoint: type === 'pie'
    } as any]
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}