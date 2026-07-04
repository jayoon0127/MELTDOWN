import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import ZoneNode from "./three/ZoneNode";
import PlayerAvatarMesh from "./three/PlayerAvatarMesh";
import FirstPersonRig from "./three/FirstPersonRig";
import BuildingShell from "./three/BuildingShell";
import { BUILDING_HALF, toWorld } from "./three/worldMap";

export default function GameMap({ zones, incidents, items, hazards, players, myId, myName, blackout, avatarElRef }) {
  const others = players.filter((p) => p.connected && p.id !== myId);
  const me = players.find((p) => p.id === myId);
  const initialPos = toWorld(me?.x ?? 0.5, me?.y ?? 0.5);

  // Stable reference: passing a fresh object literal to Canvas's `camera`
  // prop every render would make R3F reset the camera transform on every
  // room-state update, fighting FirstPersonRig's per-frame positioning.
  const cameraConfig = useMemo(() => ({ fov: 75, near: 0.1, far: 60 }), []);

  return (
    <Canvas className="game-map-canvas" camera={cameraConfig} dpr={[1, 1.5]}>
      <color attach="background" args={[blackout ? "#050810" : "#0d1a2b"]} />
      <fog attach="fog" args={[blackout ? "#050810" : "#0d1a2b", 4, 24]} />
      <ambientLight intensity={blackout ? 0.35 : 0.85} />
      <directionalLight position={[5, 10, 4]} intensity={blackout ? 0.3 : 1.1} />

      <gridHelper args={[BUILDING_HALF * 2, 20, "#2a4568", "#152438"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[BUILDING_HALF * 2, BUILDING_HALF * 2]} />
        <meshStandardMaterial color={blackout ? "#080e16" : "#0c1826"} />
      </mesh>
      <BuildingShell />

      {zones.map((zone) => {
        const incidentCount = incidents.filter((i) => i.zone === zone.id).length;
        const zoneItems = (items || []).filter((it) => it.zoneId === zone.id && !it.carriedBy);
        const isDark = blackout && zone.id !== "generator";
        return (
          <ZoneNode key={zone.id} zone={zone} incidentCount={incidentCount} isDark={isDark} items={zoneItems} />
        );
      })}

      {others.map((p) => {
        const carried = (items || []).find((it) => it.carriedBy === p.id);
        return (
          <group key={p.id} position={toWorld(p.x, p.y)}>
            <PlayerAvatarMesh color="#9db0c9" name={p.name} carriedIcon={carried?.icon} />
          </group>
        );
      })}

      {/* Items not tied to any room (the hallway break-area snacks, or
          anything dropped/thrown outside a zone) — in-zone items are
          rendered by ZoneNode instead. */}
      {(items || [])
        .filter((it) => !it.carriedBy && !it.zoneId && it.x != null)
        .map((it) => {
          const [ix, , iz] = toWorld(it.x, it.y);
          return (
            <Html key={it.id} position={[ix, 0.6, iz]} center style={{ pointerEvents: "none" }}>
              <div className="item3d-icon">{it.icon}</div>
            </Html>
          );
        })}

      {(hazards || []).map((hz) => {
        const [hx, , hzz] = toWorld(hz.x, hz.y);
        return (
          <group key={hz.id} position={[hx, 0, hzz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
              <circleGeometry args={[0.16, 16]} />
              <meshStandardMaterial color="#e8d34a" />
            </mesh>
            <Html position={[0, 0.3, 0]} center style={{ pointerEvents: "none" }}>
              <div className="item3d-icon">{hz.icon}</div>
            </Html>
          </group>
        );
      })}

      <group ref={avatarElRef} position={initialPos} />
      <FirstPersonRig avatarRef={avatarElRef} />
    </Canvas>
  );
}
