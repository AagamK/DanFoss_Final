import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Define the shape of the incoming data props
interface SensorDataChartsProps {
    data: { [key: string]: any }[];
}

// A Map to provide better, more readable names for known headers from your CSV
const headerDisplayNames: { [key: string]: string } = {
    'Piston Side flow': 'Piston Flow',
    'Rod Side Flow': 'Rod Flow',
    'Piston side pressure': 'Piston Pressure',
    'Rod side pressure': 'Rod Pressure',
    'Speed': 'Speed',
    'Disoplacement': 'Displacement',
};

// A robust helper function to check if a value is a plottable number
const isPlottableNumber = (value: any): value is number => {
    return typeof value === 'number' && isFinite(value);
};

export function SensorDataCharts({ data }: SensorDataChartsProps) {
    
    // Find the primary key for the X-axis (usually 'Time'), case-insensitive
    const timeKey = useMemo(() => {
        if (!data || data.length === 0) return 'time'; // Default
        const headers = Object.keys(data[0]);
        return headers.find(key => key.toLowerCase().trim() === 'time') || headers[0];
    }, [data]);
    
    // Determine which columns from the CSV are numeric and should be plotted
    const chartKeys = useMemo(() => {
        if (!data || data.length === 0) return [];
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        
        return headers.filter(key => 
            key.toLowerCase().trim() !== timeKey.toLowerCase().trim() && 
            isPlottableNumber(firstRow[key])
        );
    }, [data, timeKey]);

    // A safe tick formatter that will not crash
    const safeTickFormatter = (value: any) => {
        if (isPlottableNumber(value)) {
            return value.toFixed(1);
        }
        return String(value);
    };

    if (!data || data.length === 0) {
        return <Card><CardHeader><CardTitle>No Data to Display</CardTitle></CardHeader><CardContent><p>Upload a file to get started.</p></CardContent></Card>;
    }
    
    if (chartKeys.length === 0) {
        return <Card><CardHeader><CardTitle>No Plottable Data</CardTitle></CardHeader><CardContent><p>The uploaded CSV does not contain any valid numeric columns to plot.</p></CardContent></Card>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chartKeys.map((key) => {
                // For each chart, filter the main data to include only valid, plottable rows
                const cleanChartData = data.filter(d => isPlottableNumber(d[key]) && isPlottableNumber(d[timeKey]));

                // If after cleaning there's no data, show a message instead of a blank chart
                if (cleanChartData.length === 0) {
                    return (
                        <Card key={key} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="truncate">{headerDisplayNames[key] || key}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center">
                                <p className="text-muted-foreground text-sm">No valid data points for this metric.</p>
                            </CardContent>
                        </Card>
                    );
                }

                return (
                    <Card key={key} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="truncate">{headerDisplayNames[key] || key}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ChartContainer
                                config={{
                                    [key]: {
                                        label: key,
                                        color: "hsl(var(--primary))", // Set color to blue
                                    },
                                }}
                                className="h-[250px] w-full"
                            >
                                <LineChart
                                    accessibilityLayer
                                    data={cleanChartData}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey={timeKey} 
                                        tickFormatter={safeTickFormatter}
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                    />
                                    <YAxis 
                                        tickFormatter={safeTickFormatter}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        width={50}
                                    />
                                    <ChartTooltip 
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />} 
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={key}
                                        stroke="hsl(var(--primary))" // Set line color to blue
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

