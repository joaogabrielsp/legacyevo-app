import React from "react";

interface TestHeaderProps {
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
}

const TestHeader: React.FC<TestHeaderProps> = ({
  title,
  subtitle,
  actionButton,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>
        <p className="text-gray-300 mt-1">
          {subtitle}
        </p>
      </div>
      {actionButton}
    </div>
  );
};

export default TestHeader;