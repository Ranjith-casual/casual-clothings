import { motion } from "framer-motion";
import nodata from "../assets/productDescriptionImages/Empty-pana.png";

const AnimatedImage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {/* Animated Image */}
      <motion.img
        src={nodata}
        alt="No Data Available"
        className="w-72 h-72 rounded-lg shadow-md border border-gray-200"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Animated Text with Professional Styling */}
      <motion.div
        className="mt-6 px-6 py-3 text-gray-600 font-medium flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        <h3 className="text-xl font-bold text-gray-900 font-serif mb-2">
          No Data Available
        </h3>
        <p className="text-sm text-gray-500">
          Nothing to display at the moment
        </p>
      </motion.div>
    </div>
  );
};

export default AnimatedImage;
