const { capture } = require("../sentry");

function formatSectionsIntoSitemap(sections) {
  return sections
    .filter((e) => e.parentId === null)
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      title: section.title,
      slug: section.slug,
      position: section.position,
      allowedRoles: section.allowedRoles,
      children: sections.filter((e) => e.parentId?.toString() === section._id?.toString()),
    }));
}

async function revalidateSiteMap() {
  try {
    const res = await fetch(`${process.env.KB_URL}/api/revalidate-sitemap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ secret: process.env.REVALIDATION_TOKEN }),
    });
    const data = await res.json();
    if (!data.revalidated) {
      capture(new Error(`Error while revalidating sitemap: ${res.status} ${res.statusText}`));
    }
  } catch (error) {
    capture(error);
  }
}

module.exports = {
  revalidateSiteMap,
  formatSectionsIntoSitemap,
};
