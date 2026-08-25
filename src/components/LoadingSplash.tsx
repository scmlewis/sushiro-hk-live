import React from 'react';
import { motion } from 'motion/react';
import { Store, Clock, MapPin } from 'lucide-react';

export const LoadingSplash: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0e10] pattern-kikkou"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <img src="/icon.png" alt="壽司郎 HK Live" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-2xl" />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center space-y-2"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            壽司郎 HK
          </h1>
          <span className="inline-block bg-[#aa151b] text-white text-[11px] font-black px-2.5 py-1 rounded tracking-widest uppercase">
            LIVE
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xs sm:text-sm text-neutral-400 text-center max-w-xs leading-relaxed font-medium"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        >
          即時追蹤全港 44 間壽司郎門市
        </motion.p>

        {/* Feature hints */}
        <motion.div
          className="flex items-center gap-4 text-neutral-500"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>門市</span>
          </div>
          <div className="w-px h-3 bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>等候時間</span>
          </div>
          <div className="w-px h-3 bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>地圖</span>
          </div>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full bg-[#aa151b] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
