import { useRef, useState, useCallback } from 'react';

// =============================================================================
// PILLAR 3: MAGNETIC UI
// Button that pulls toward the cursor like a magnetic field
// Wraps any child content with the magnetic effect
// =============================================================================

export default function MagneticButton({ children, className = '', as = 'button', onClick, ...props }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    // Magnetic pull strength — max 12px displacement
    const strength = 0.3;
    const x = Math.max(-12, Math.min(12, distX * strength));
    const y = Math.max(-12, Math.min(12, distY * strength));
    setPosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      style={{
        transform: isHovered
          ? `translate(${position.x}px, ${position.y}px) scale(1.04)`
          : 'translate(0px, 0px) scale(1)',
        transition: isHovered
          ? 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
