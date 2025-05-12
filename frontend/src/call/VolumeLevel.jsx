const numBars = 10;

const VolumeLevel = ({ volume }) => {
  return (
    <div className="flex items-end space-x-1 mt-4">
      {Array.from({ length: numBars }, (_, i) => {
        const isActive = i / numBars < volume;
        return (
          <div
            key={i}
            className={`w-2 rounded-sm transition-all duration-200
              ${isActive ? "bg-green-400" : "bg-gray-600"}`}
            style={{ height: `${(i) * 6}px` }} 
          ></div>
        );
      })}
    </div>
  );
};

export default VolumeLevel;
