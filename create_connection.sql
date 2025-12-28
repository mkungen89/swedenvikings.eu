INSERT INTO "ServerConnection" (id, name, type, "serverPath", "steamCmdPath", platform, "isDefault", status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Lokal Server',
  'local',
  'C:\arma-reforger-server',
  'C:\steamcmd',
  'windows',
  true,
  'disconnected',
  NOW(),
  NOW()
);

