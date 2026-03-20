const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-orange-600 text-white px-4 py-2 z-50 focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );
};

export default SkipNavigation;