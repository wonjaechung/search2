import React, { useRef, useEffect } from "react";
import { View, ScrollView, Platform } from "react-native";

interface WebScrollArrowsProps {
  children: React.ReactNode;
  scrollAmount?: number;
  contentContainerStyle?: any;
  snapToInterval?: number;
  decelerationRate?: "fast" | "normal" | number;
  snapToAlignment?: "start" | "center" | "end";
}

export default function WebScrollArrows({
  children,
  contentContainerStyle,
  snapToInterval,
  decelerationRate,
  snapToAlignment,
}: WebScrollArrowsProps) {
  const containerRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const currentScrollX = useRef(0);
  const lastDragScrollX = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const node = containerRef.current as any;
    if (!node) return;

    const el = node as unknown as HTMLElement;
    if (!el || !el.addEventListener) return;

    const scrollContainer = el.querySelector('[data-testid="web-drag-scroll"]') as HTMLElement;
    if (!scrollContainer) return;

    const setDragStyles = (dragging: boolean) => {
      el.style.cursor = dragging ? "grabbing" : "grab";
      el.style.userSelect = dragging ? "none" : "";
      (el.style as any).webkitUserSelect = dragging ? "none" : "";
    };

    const startDrag = (clientX: number) => {
      isDragging.current = true;
      hasMoved.current = false;
      startX.current = clientX;
      scrollStart.current = currentScrollX.current;
      lastDragScrollX.current = currentScrollX.current;
      setDragStyles(true);
    };

    const moveDrag = (clientX: number) => {
      if (!isDragging.current) return;
      const diff = clientX - startX.current;
      if (Math.abs(diff) > 3) hasMoved.current = true;
      const nextX = Math.max(0, scrollStart.current - diff);
      lastDragScrollX.current = nextX;
      scrollViewRef.current?.scrollTo({ x: nextX, animated: false });
    };

    const endDrag = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setDragStyles(false);

      if (hasMoved.current && snapToInterval) {
        const snapped = Math.round(lastDragScrollX.current / snapToInterval) * snapToInterval;
        lastDragScrollX.current = snapped;
        scrollViewRef.current?.scrollTo({ x: snapped, animated: true });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      startDrag(e.clientX);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      moveDrag(e.clientX);
    };

    const onMouseUp = () => {
      endDrag();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      startDrag(e.clientX);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      moveDrag(e.clientX);
    };

    const onPointerUp = () => {
      endDrag();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (hasMoved.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    setDragStyles(false);
    // Keep vertical page scroll while enabling horizontal mouse drag.
    (scrollContainer.style as any).touchAction = "pan-y";

    if (typeof window !== "undefined" && "PointerEvent" in window) {
      el.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    } else {
      el.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    el.addEventListener("click", onClickCapture, true);

    return () => {
      if (typeof window !== "undefined" && "PointerEvent" in window) {
        el.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      } else {
        el.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      el.removeEventListener("click", onClickCapture, true);
      (scrollContainer.style as any).touchAction = "";
    };
  }, [snapToInterval]);

  if (Platform.OS !== "web") {
    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        snapToInterval={snapToInterval}
        decelerationRate={decelerationRate}
        snapToAlignment={snapToAlignment}
        onScroll={(e) => {
          currentScrollX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View ref={containerRef}>
      <ScrollView
        ref={scrollViewRef}
        testID="web-drag-scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        snapToInterval={snapToInterval}
        decelerationRate={decelerationRate}
        snapToAlignment={snapToAlignment}
        onScroll={(e) => {
          currentScrollX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </View>
  );
}
