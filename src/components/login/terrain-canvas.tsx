"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

function Scene() {
  const { scene } = useThree();

  useMemo(() => {
    scene.fog = new THREE.FogExp2(0x030711, 0.045);
    scene.background = new THREE.Color(0x030711);
  }, [scene]);

  return null;
}

function Terrain() {
  const timeRef = useRef(0);
  const noise3D = useMemo(() => createNoise3D(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(24, 24, 80, 80);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.18;
    const t = timeRef.current;
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, noise3D(x * 0.35, z * 0.35, t) * 0.9);
    }

    pos.needsUpdate = true;
  });

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#3b6ea8"
        wireframe
        transparent
        opacity={0.05}
      />
    </mesh>
  );
}

export default function TerrainCanvas() {
  return (
    <Canvas
      camera={{ fov: 55, position: [0, 4, 10] }}
      style={{ position: "fixed", inset: 0, zIndex: -1 }}
    >
      <Scene />
      <Terrain />
    </Canvas>
  );
}
