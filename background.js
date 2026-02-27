const ADMIN_PATHS = ["/gestione", "/login", "/wp-admin"];

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    // 404 = not found, 5xx = server error → skip; everything else counts as "exists"
    return response.status !== 404 && response.status < 500;
  } catch {
    return false;
  }
}

async function navigateToAdmin(tab) {
  const { origin } = new URL(tab.url);

  for (const path of ADMIN_PATHS) {
    const adminUrl = origin + path;
    const exists = await checkUrl(adminUrl);
    if (exists) {
      await chrome.tabs.update(tab.id, { url: adminUrl });
      return;
    }
  }

  // Nothing responded — fall back to the last path anyway
  await chrome.tabs.update(tab.id, { url: origin + ADMIN_PATHS[ADMIN_PATHS.length - 1] });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-admin") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("http")) return; // ignore chrome:// etc.

  await navigateToAdmin(tab);
});
