import map from "./assets/map.svg";

import type { JSX } from "react";

const Carousel = (): JSX.Element => (
  <section aria-label="Company mission" className="px-0 md:px-8 lg:px-6">
    <div className="flex flex-col w-full mt-8 mb-10 rounded-[20px] border border-[rgb(var(--theme-color-rgb) / 0.1)]">
      <div className="w-full h-[50px] md:h-[80px] clip"></div>
      <div className="relative w-full flex items-start justify-center py-5 md:py-0 md:items-center px-4 md:px-16">
        <div className=" flex flex-row justify-center py-4 space-x-4 md:py-6 items-center md:space-x-[10%]">
          <img src={map} className="w-[92px] h-[100px] md:w-auto md:h-auto" alt="Map of Africa" />
          <p className=" text-base md:text-3xl xl:text-[32px] font-Outfit font-medium">
            Making Cloud Services Available For African Businesses, Organizations & Governments
          </p>
        </div>
      </div>
      <div className="w-full h-[50px] md:h-[80px] clip"></div>
    </div>
  </section>
);

export default Carousel;
