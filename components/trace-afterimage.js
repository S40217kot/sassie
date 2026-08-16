"use client";

import { useEffect, useMemo, useRef, useState } from "react";

let nextTraceStartAt = 0;
const animatedPostIds = new Set();

function numberBetween(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hashPostId(postId) {
  let hash = 2166136261;
  for (const character of postId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededFraction(seed, offset) {
  const value = Math.sin(seed * 0.0001 + offset * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildStages(postId, finalLength, writingDuration, rewriteCount) {
  const seed = hashPostId(postId);
  const duration = numberBetween(Number(writingDuration) || 1, 1, 3600);
  const revisions = numberBetween(Number(rewriteCount) || 0, 0, 20);
  const finalCount = numberBetween(Number(finalLength) || 1, 1, 10000);
  const intermediateCount = numberBetween(1 + Math.ceil(revisions / 2), 1, 4);
  const variation = 0.1 + Math.min(revisions, 6) * 0.035;
  const counts = [
    Math.max(1, Math.round(finalCount * (0.38 + seededFraction(seed, 1) * 0.22))),
  ];

  for (let index = 0; index < intermediateCount; index += 1) {
    const direction = index % 2 === 0 ? 1 : -1;
    const amount = Math.max(
      1,
      Math.round(finalCount * variation * (0.65 + seededFraction(seed, index + 2) * 0.7)),
    );
    counts.push(Math.max(1, finalCount + direction * amount));
  }
  counts.push(finalCount);

  const durationFactor = Math.log1p(duration) / Math.log(3601);
  const totalDuration = Math.round(1500 + durationFactor * 1400);
  const weights = counts.slice(1).map((_, index) => (
    (index % 2 === 0 ? 0.82 : 1.28) + seededFraction(seed, index + 10) * 0.28
  ));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let elapsed = 0;

  return counts.map((count, index) => {
    if (index > 0) elapsed += totalDuration * (weights[index - 1] / totalWeight);
    return { count, at: Math.round(elapsed) };
  });
}

export function TraceAfterimage({ postId, finalLength, writingDuration, rewriteCount }) {
  const finalCount = numberBetween(Number(finalLength) || 1, 1, 10000);
  const stages = useMemo(
    () => buildStages(postId, finalCount, writingDuration, rewriteCount),
    [postId, finalCount, writingDuration, rewriteCount],
  );
  const [stageIndex, setStageIndex] = useState(stages.length - 1);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || animatedPostIds.has(postId)) {
      setStageIndex(stages.length - 1);
      return undefined;
    }

    let startTimer;
    const stageTimers = [];
    let observer;

    const begin = () => {
      animatedPostIds.add(postId);
      setStageIndex(0);
      for (let index = 1; index < stages.length; index += 1) {
        stageTimers.push(setTimeout(() => setStageIndex(index), stages[index].at));
      }
    };

    const encounter = () => {
      observer?.disconnect();
      const now = Date.now();
      const queuedDelay = Math.max(0, nextTraceStartAt - now);
      nextTraceStartAt = now + queuedDelay + 520;
      startTimer = setTimeout(begin, queuedDelay + 240);
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.4)) {
          encounter();
        }
      }, { threshold: [0.4] });
      observer.observe(element);
    } else {
      encounter();
    }

    return () => {
      observer?.disconnect();
      clearTimeout(startTimer);
      stageTimers.forEach(clearTimeout);
    };
  }, [postId, stages]);

  const count = stages[stageIndex]?.count ?? finalCount;

  return (
    <div ref={elementRef} className="masked trace-afterimage" aria-label={`${finalCount}文字分の伏せられたメッセージ`}>
      <span key={stageIndex} className="trace-afterimage-shape" aria-hidden="true">
        {"□".repeat(count)}
      </span>
    </div>
  );
}
