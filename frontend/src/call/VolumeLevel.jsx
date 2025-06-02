const numBars = 12;

const VolumeLevel = ({ volume }) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-end space-x-[2px] h-8">
        {Array.from({ length: numBars }, (_, i) => {
          const isActive = i / numBars < volume;
          const height = Math.max(4, ((i + 1) / numBars) * 32);
          return (
            <div
              key={i}
              className="relative group"
              style={{ height: `${height}px` }}
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-full blur-sm transition-opacity duration-300
                  ${isActive ? 'opacity-70 bg-[#0071e3]' : 'opacity-0'}`}
              />
              {/* Bar */}
              <div
                className={`relative w-1 rounded-full transition-all duration-300 transform
                  ${isActive 
                    ? 'bg-gradient-to-t from-[#0071e3] to-[#48aaff] scale-y-100' 
                    : 'bg-[#2d2d2f] scale-y-90'}`}
                style={{ height: '100%' }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[13px] text-[#86868b] font-medium">
        Volume Level
      </p>

      <style jsx>{`
        .scale-y-90 {
          transform: scaleY(0.9);
        }
        .scale-y-100 {
          transform: scaleY(1);
        }
      `}</style>
    </div>
  );
};

export default VolumeLevel;
