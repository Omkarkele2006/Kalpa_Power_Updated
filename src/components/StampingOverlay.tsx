export const StampingOverlay = () => (
  <div className="absolute top-10 right-10 border-8 border-red-500/50 p-4 rounded-xl rotate-12 pointer-events-none select-none">
    <h1 className="text-red-500/50 text-6xl font-black uppercase">Approved</h1>
    <p className="text-red-500/50 text-xl font-bold text-center">KALPA POWER</p>
    <p className="text-red-500/50 text-sm text-center">{new Date().toLocaleDateString()}</p>
  </div>
);