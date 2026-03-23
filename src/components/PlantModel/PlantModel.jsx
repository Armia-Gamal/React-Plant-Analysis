import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function PlantModel() {
  const { scene } = useGLTF("/plant.glb");
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;

      ref.current.rotation.x = -0.3;

      ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return <primitive ref={ref} object={scene} scale={1.5} />;
}