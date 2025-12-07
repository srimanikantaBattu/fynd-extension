
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { cn } from "../../lib/utils";

export function StatBox({ title, value, icon: Icon, description, trend, trendUp, className }) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow border-slate-100", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-medium text-slate-600">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div> {/* Larger Value */}
        {(description || trend) && (
          <p className="text-sm text-slate-500 mt-2 flex items-center">
            {trend && (
              <span className={cn("font-medium px-2 py-0.5 rounded-full text-xs mr-2", 
                  trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" 
              )}>
                {trend}
              </span>
            )}
            <span className="text-slate-400">{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
