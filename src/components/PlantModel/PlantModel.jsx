import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export default function PlantModel() {
  const { scene } = useGLTF("/aglaonema_plant.glb");
  const ref = useRef();
  const { invalidate } = useThree(); // 🔥 مهم

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y += 0.003;
    ref.current.rotation.x = -0.3;
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;

    invalidate(); // 🔥 يرندر بس وقت الحركة
  });

  return <primitive ref={ref} object={scene} scale={3.5} />;
}