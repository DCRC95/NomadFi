"use client";
import React from "react";
import StrategyList from "../components/StrategyList";

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Strategies</h1>
      <StrategyList />
    </main>
  );
} 