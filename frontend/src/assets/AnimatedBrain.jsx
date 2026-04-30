import React from "react";
import { Brain, Sparkles } from "lucide-react";

const StaticBrain = () => {
  return (
    // Outer circle (the main brain shape)
    <div className="relative
                    w-56 h-56           /* Default size for mobile */
                    md:w-72 md:h-72     /* Larger size for medium screens and up */
                    lg:w-96 lg:h-96     /* Even larger for large screens and up (adjust as needed) */
                    bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">

      {/* Inner circle */}
      <div className="
                      w-40 h-40           /* Default size for mobile */
                      md:w-56 md:h-56     /* Larger size for medium screens and up */
                      lg:w-72 lg:h-72     /* Even larger for large screens and up (adjust as needed) */
                      bg-white/20 rounded-full flex items-center justify-center">

        <div className="relative">
          {/* Brain icon */}
          <Brain className="
                           w-12 h-12           /* Default size for mobile */
                           md:w-16 md:h-16     /* Larger size for medium screens and up */
                           lg:w-24 lg:h-24     /* Even larger for large screens and up (adjust as needed) */
                           text-white drop-shadow-lg" />

          {/* Sparkles icon */}
          <div className="absolute
                          -top-2 -right-2     /* Default position for mobile */
                          md:-top-3 md:-right-3 /* Adjust position for larger brain */
                          lg:-top-4 lg:-right-4 /* Further adjust position for largest brain */
                          w-6 h-6           /* Default size for mobile */
                          md:w-8 md:h-8     /* Larger size for medium screens and up */
                          lg:w-10 lg:h-10   /* Even larger for large screens and up */
                          bg-yellow-400 rounded-full flex items-center justify-center">
            <Sparkles className="
                                w-4 h-4           /* Default size for mobile */
                                md:w-6 md:h-6     /* Larger size for medium screens and up */
                                lg:w-8 lg:h-8     /* Even larger for large screens and up */
                                text-white" />
          </div>
        </div>
      </div>

      {/* Static floating labels - Adjust positioning for larger brain */}
      <div className="absolute
                      -top-4 -left-16       /* Default position for mobile */
                      md:text-sm md:-top-6 md:-left-20 /* Adjust for md size */
                      lg:text-base lg:-top-8 lg:-left-24 /* Adjust for lg size */
                      bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
        AI
      </div>
      <div className="absolute
                      -bottom-4 -right-16   /* Default position for mobile */
                      md:text-sm md:-bottom-6 md:-right-20 /* Adjust for md size */
                      lg:text-base lg:-bottom-8 lg:-right-24 /* Adjust for lg size */
                      bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
        Search
      </div>
      <div className="absolute
                      top-0 right-0         /* Default position for mobile */
                      md:text-sm md:top-0 md:right-0 /* Adjust for md size (no change usually needed) */
                      lg:text-base lg:top-0 lg:right-0 /* Adjust for lg size (no change usually needed) */
                      bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
        Smart
      </div>
    </div>
  );
};

export default StaticBrain;