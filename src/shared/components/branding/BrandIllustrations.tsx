import React from "react";

type IllustrationProps = React.SVGProps<SVGSVGElement>;

export const MonitorIllustration = ({ className, ...props }: IllustrationProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    {...props}
    className={className}
  >
    <path
      d="M4.2935 1.33334H11.7002C14.0735 1.33334 14.6668 1.92668 14.6668 4.29334V8.51334C14.6668 10.8867 14.0735 11.4733 11.7068 11.4733H4.2935C1.92683 11.48 1.3335 10.8867 1.3335 8.52001V4.29334C1.3335 1.92668 1.92683 1.33334 4.2935 1.33334Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 11.48V14.6666" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M1.3335 8.66666H14.6668"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 14.6667H11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloudConnectionIllustration = ({ className, ...props }: IllustrationProps) => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    {...props}
    className={className}
  >
    <path
      d="M47.9993 36.95C45.8493 38.925 42.9993 40.025 40.0743 40H15.9243C5.74932 39.275 5.72432 24.5 15.9243 23.775H16.0243C9.04932 4.37503 38.5243 -3.34997 41.8993 17C51.3243 18.2 55.1493 30.725 47.9993 36.95Z"
      fill="url(#brand-cloud-gradient)"
    />
    <path
      d="M46.875 52.5C46.875 53.525 46.025 54.375 45 54.375H35C34.875 54.375 34.775 54.375 34.65 54.325C33.925 56.175 32.1 57.5 30 57.5C27.9 57.5 26.075 56.175 25.35 54.325C25.225 54.375 25.125 54.375 25 54.375H15C13.975 54.375 13.125 53.525 13.125 52.5C13.125 51.475 13.975 50.625 15 50.625H25C25.125 50.625 25.225 50.625 25.35 50.675C25.85 49.375 26.875 48.35 28.175 47.85C28.125 47.725 28.125 47.625 28.125 47.5V40H31.875V47.5C31.875 47.625 31.875 47.725 31.825 47.85C33.125 48.35 34.15 49.375 34.65 50.675C34.775 50.625 34.875 50.625 35 50.625H45C46.025 50.625 46.875 51.475 46.875 52.5Z"
      fill="url(#brand-cloud-gradient-2)"
    />
    <defs>
      <linearGradient
        id="brand-cloud-gradient"
        x1="9.24258"
        y1="36.9814"
        x2="51.1314"
        y2="31.9331"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--theme-color, #288dd1)" />
        <stop offset="1" stopColor="var(--secondary-color, #3fe0c8)" />
      </linearGradient>
      <linearGradient
        id="brand-cloud-gradient-2"
        x1="13.8703"
        y1="55.9906"
        x2="45.7816"
        y2="50.0116"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--theme-color, #288dd1)" />
        <stop offset="1" stopColor="var(--secondary-color, #3fe0c8)" />
      </linearGradient>
    </defs>
  </svg>
);

export const MobileIllustration = ({ className, ...props }: IllustrationProps) => (
  <svg
    width="61"
    height="61"
    viewBox="0 0 61 61"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    {...props}
    className={className}
  >
    <path
      d="M40.7431 5.93713L19.5431 5.93713C12.6431 5.93713 10.1431 8.43713 10.1431 15.4621L10.1431 46.4121C10.1431 53.4371 12.6431 55.9371 19.5431 55.9371H40.7181C47.6431 55.9371 50.1431 53.4371 50.1431 46.4121V15.4621C50.1431 8.43713 47.6431 5.93713 40.7431 5.93713ZM30.1431 49.1871C27.7431 49.1871 25.7681 47.2121 25.7681 44.8121C25.7681 42.4121 27.7431 40.4371 30.1431 40.4371C32.5431 40.4371 34.5181 42.4121 34.5181 44.8121C34.5181 47.2121 32.5431 49.1871 30.1431 49.1871ZM35.1431 16.5621H25.1431C24.1181 16.5621 23.2681 15.7121 23.2681 14.6871C23.2681 13.6621 24.1181 12.8121 25.1431 12.8121L35.1431 12.8121C36.1681 12.8121 37.0181 13.6621 37.0181 14.6871C37.0181 15.7121 36.1681 16.5621 35.1431 16.5621Z"
      fill="url(#brand-mobile-gradient)"
    />
    <defs>
      <linearGradient
        id="brand-mobile-gradient"
        x1="11.0264"
        y1="51.6246"
        x2="49.9398"
        y2="48.6002"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="var(--theme-color, #288dd1)" />
        <stop offset="1" stopColor="var(--secondary-color, #3fe0c8)" />
      </linearGradient>
    </defs>
  </svg>
);
