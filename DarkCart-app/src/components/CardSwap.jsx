import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";

export const Card = forwardRef(
  ({ customClass, title, description, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={`absolute top-1/2 left-1/2 rounded-xl border border-white bg-gradient-to-br from-gray-900 to-black shadow-2xl [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] overflow-hidden cursor-pointer card-carousel-card ${customClass ?? ""} ${rest.className ?? ""}`.trim()}
    >
      {rest.children}
      {(title || description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 md:p-6 text-white transition-all duration-300">
          {title && (
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 md:mb-2 text-white leading-tight drop-shadow-lg">{title}</h3>
          )}
          {description && (
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 leading-tight sm:leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-md">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
);
Card.displayName = "Card";

const makeSlot = (
  i,
  distX,
  distY,
  total
) => ({
  x: i * distX * 2.0, // Further increased multiplier for maximum spread
  y: -i * distY,
  z: -i * distX * 1.0, // Reduced z-depth to keep cards more visible
  zIndex: total - i,
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = true,
  onCardClick,
  skewAmount = 6,
  easing = "elastic",
  responsive = true,
  children,
}) => {
  const config =
    easing === "elastic"
      ? {
        ease: "elastic.out(0.6,0.9)",
        durDrop: 2,
        durMove: 2,
        durReturn: 2,
        promoteOverlap: 0.9,
        returnDelay: 0.05,
      }
      : {
        ease: "power1.inOut",
        durDrop: 0.8,
        durMove: 0.8,
        durReturn: 0.8,
        promoteOverlap: 0.45,
        returnDelay: 0.2,
      };

  const childArr = useMemo(
    () => Children.toArray(children),
    [children]
  );
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order = useRef(
    Array.from({ length: childArr.length }, (_, i) => i)
  );

  const tlRef = useRef(null);
  const intervalRef = useRef();
  const container = useRef(null);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // Handle window resize for responsive updates
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Responsive calculations for full screen coverage
  const getResponsiveValues = () => {
    if (!responsive) return { width, height, cardDistance, verticalDistance };
    
    const screenWidth = windowSize.width;
    const screenHeight = windowSize.height;
    
    if (screenWidth <= 480) {
      return {
        width: screenWidth * 1.4, // Further increased to eliminate gaps
        height: screenHeight * 0.9, 
        cardDistance: cardDistance * 0.9, 
        verticalDistance: verticalDistance * 0.8, 
      };
    } else if (screenWidth <= 768) {
      return {
        width: screenWidth * 1.3, // Further increased to eliminate gaps
        height: screenHeight * 0.9, 
        cardDistance: cardDistance * 1.0, 
        verticalDistance: verticalDistance * 0.85, 
      };
    } else if (screenWidth <= 1024) {
      return {
        width: screenWidth * 1.2, // Further increased for full coverage
        height: screenHeight * 0.95, 
        cardDistance: cardDistance * 1.1, 
        verticalDistance: verticalDistance * 0.9, 
      };
    } else {
      // Large screens - extend beyond viewport to eliminate all gaps
      return {
        width: screenWidth * 1.1, // Increased to cover entire width plus some
        height: screenHeight * 1.0,
        cardDistance: cardDistance * 1.3, // Increased spacing for better spread
        verticalDistance: verticalDistance * 1.0,
      };
    }
  };

  const responsiveValues = getResponsiveValues();

  useEffect(() => {
    const total = refs.length;
    const { cardDistance: respCardDistance, verticalDistance: respVerticalDistance } = responsiveValues;
    
    refs.forEach((r, i) =>
      placeNow(
        r.current,
        makeSlot(i, respCardDistance, respVerticalDistance, total),
        skewAmount
      )
    );

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: "+=500",
        duration: config.durDrop,
        ease: config.ease,
      });

      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, respCardDistance, respVerticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(
        refs.length - 1,
        respCardDistance,
        respVerticalDistance,
        refs.length
      );
      tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        "return"
      );
      tl.set(elFront, { x: backSlot.x, z: backSlot.z }, "return");
      tl.to(
        elFront,
        {
          y: backSlot.y,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return"
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current;
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener("mouseenter", pause);
      node.addEventListener("mouseleave", resume);
      return () => {
        node.removeEventListener("mouseenter", pause);
        node.removeEventListener("mouseleave", resume);
        clearInterval(intervalRef.current);
      };
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, responsiveValues.cardDistance, responsiveValues.verticalDistance, windowSize]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
        key: i,
        ref: refs[i],
        style: { 
          width: responsiveValues.width, 
          height: responsiveValues.height, 
          ...(child.props.style ?? {}) 
        },
        onClick: (e) => {
          child.props.onClick?.(e);
          onCardClick?.(i);
        },
      }) : child
  );

  return (
    <div
      ref={container}
      className="w-full h-full overflow-hidden perspective-[1000px]
                 
                 /* Positioning to fill container properly */
                 translate-x-[-20%] translate-y-[0%]
                 
                 /* Mobile positioning */
                 max-[480px]:translate-x-[-25%] max-[480px]:translate-y-[0%] max-[480px]:scale-110
                 
                 /* Tablet positioning */
                 max-[768px]:translate-x-[-20%] max-[768px]:translate-y-[0%] max-[768px]:scale-105
                 
                 /* Desktop positioning */
                 min-[769px]:translate-x-[-15%] min-[769px]:translate-y-[0%]
                 
                 /* Large desktop positioning */
                 min-[1024px]:translate-x-[-10%] min-[1024px]:translate-y-[0%]
                 min-[1280px]:translate-x-[-5%] min-[1280px]:translate-y-[0%]"
      style={{ width: responsiveValues.width, height: responsiveValues.height }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {rendered}
      </div>
      
      {/* Responsive pause indicator */}
      {pauseOnHover && (
        <div className="absolute -top-8 left-0 text-xs text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm opacity-75 max-[768px]:text-[10px] max-[480px]:hidden z-20">
          Hover to pause
        </div>
      )}
    </div>
  );
};

export default CardSwap;
