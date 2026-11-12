import { gpus, museumRacks } from "./gpuData.js";

export default function MuseumMap({ player, onVisit, onEntrance }) {
  const bay = Math.max(0, Math.min(3, Math.round((3 - player.z) / 13)));
  const side =
    Math.abs(player.x) > 1
      ? Math.sign(player.x)
      : Math.abs(Math.sin(player.yaw)) > 0.6
        ? Math.sign(Math.sin(player.yaw))
        : 0;
  const current =
    player.z < 9 && side
      ? museumRacks.find((r) => r.bay === bay && r.side === side)
      : null;
  const marker = Math.max(5, Math.min(94, ((player.z + 40) / 60) * 100));
  return (
    <div className="museum-map">
      <p className="gpu-panel-intro">
        {museumRacks.length} galleries. {gpus.length} models. Choose a gallery
        to visit, or explore on foot.
      </p>
      <div className="museum-map-plan" aria-label="Museum gallery map">
        <div className="museum-map-aisle" aria-hidden="true">
          <span>Graphics hall</span>
          <i style={{ top: `${marker}%` }} />
        </div>
        {museumRacks.map((r, index) => {
          const models = gpus.filter((g) => g.generation === r.generation);
          return (
            <button
              key={r.id}
              className="museum-map-room"
              style={{ gridColumn: r.side < 0 ? 1 : 3, gridRow: 4 - r.bay }}
              aria-label={`Visit ${r.maker} ${r.generation} gallery`}
              aria-current={current?.id === r.id ? "location" : undefined}
              onClick={() => onVisit(r.id)}
            >
              <span className="museum-map-room-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="museum-map-maker">{r.maker}</span>
              <strong>{r.generation}</strong>
              <small>{models[0].architecture}</small>
              <span className="museum-map-count">
                {models.length} models <b>↗</b>
              </span>
            </button>
          );
        })}
      </div>
      <div className="museum-map-foyer">
        <div>
          <strong>Foyer</strong>
          <span>Featured cards & collection entrance</span>
        </div>
        <button onClick={onEntrance}>Back to foyer ↗</button>
      </div>
      <p className="museum-map-help">
        <i /> Your position{" "}
        <span>Press M to open this map while exploring.</span>
      </p>
    </div>
  );
}
