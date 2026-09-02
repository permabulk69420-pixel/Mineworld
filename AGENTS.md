# Working on Mineworld

Mineworld is a long-running, original Three.js VR voxel game. The owner provides occasional playtests and gives the developer broad creative direction. Build a coherent game over successive sessions; keep each released version playable.

- Read `docs/DIRECTION.md` and the latest `docs/DEVELOPMENT.md` entry first.
- Use plain Three.js and Vite. Build for Meta Quest VR. The public entry is VR only; keyboard/mouse exist solely behind `?test=1` for developer checks. Do not add phone gameplay or make desktop a product goal unless the owner asks.
- Keep publishing through GitHub Actions to the existing GitHub Pages URL. Do not migrate hosting unless asked.
- Choose the next useful, bounded feature when asked to iterate. Finish, validate, and document it before expanding the scope.
- Original procedural assets are intentional. Do not copy Minecraft branding, textures, or sounds. Keep runtime assets bundled.
- Keep VR scale, floor height, camera ownership, controller handedness, and head-centred turning correct. Do not use desktop camera manipulation while WebXR owns the pose.
- Keep geometry in chunk meshes and decorations instanced. Dispose replaced GPU resources. Do not add per-block meshes or expensive screen-space effects as the default.
- Never silently discard saves. Version generator changes and retain earlier generators. Import must validate before replacing data; preserve unreadable saves.
- Tests cover behavioral risks: collision, rays, chunk boundaries, persistence, and live game flows. Run `npm run check`; browser changes also need `npm run test:browser` in a graphics-enabled environment or Actions.
- Inspect screenshots before asking the owner to test. Never call software-browser FPS a Quest result. State clearly when actual headset validation is still pending.
- Update the development journal with the shipped behavior, validation, known limitations, and a concrete next direction. Keep the README controls current.
- Do not add unrelated APIs, account systems, monetization, or analytics without a reason in the current request.
