import type { CampaignState, ViewState, User } from "../shared/types";
export function viewFor(
  state: CampaignState,
  user: User,
  ownerId: string,
): Omit<
  ViewState,
  "id" | "name" | "description" | "banner" | "ownerId" | "revision" | "online"
> {
  const master = user.id === ownerId;
  const scenes = state.scenes
    .filter((s) => master || s.visible)
    .map((s) =>
      master
        ? s
        : {
            ...s,
            rooms: s.rooms.filter((r) => r.visible),
            choices: s.choices.map((c) => ({ ...c, condition: c.condition })),
            dialogues: s.dialogues.slice(0, s.dialogueIndex + 1),
          },
    );
  const active = state.scenes.find((s) => s.id === state.activeSceneId);
  return {
    ...state,
    scenes,
    characters: state.characters
      .filter(
        (c) =>
          master ||
          (!c.hidden &&
            (!active ||
              !active.rooms.some(
                (r) =>
                  !r.visible &&
                  inside(c.position.x + 0.5, c.position.y + 0.5, r.points),
              ))),
      )
      .map((c) => {
        const {
          deck,
          draw,
          hand,
          discard,
          banished,
          formationDraw,
          formationHand,
          formationDiscard,
          ...publicData
        } = c;
        const own = c.ownerId === user.id && (!c.npc || master);
        return {
          ...publicData,
          handCount: hand.length,
          drawCount: draw.length,
          discardCount: discard.length,
          banishedCount: banished.length,
          ...(own ? { hand, deck, formationHand } : {}),
        };
      }),
    combat: {
      ...state.combat,
      pending: state.combat.pending.map(({ actor, target }) => ({
        actor,
        target,
      })),
    },
    logs: state.logs.filter((l) => master || l.kind !== "audit"),
    variables: master ? state.variables : {},
  };
}
export function inside(x: number, y: number, points: number[]) {
  let result = false;
  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const xi = points[i],
      yi = points[i + 1],
      xj = points[j],
      yj = points[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      result = !result;
  }
  return result;
}
