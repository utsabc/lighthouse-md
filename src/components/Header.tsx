import { Stethoscope } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b border-red-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center">
          <div className="flex-1"></div>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-red-900">
                  Lighthouse MD
                </h1>
                <p className="text-sm text-red-600">
                  Medical Document Assistant
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
