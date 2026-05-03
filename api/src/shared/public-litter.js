function formatDisplayDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function buildHeaderSubtitle(litter) {
  const parts = [];

  if (litter.birthDate) {
    parts.push(`Born ${formatDisplayDate(litter.birthDate)}`);
  }

  if (litter.readyDate) {
    parts.push(`Ready for homes ${formatDisplayDate(litter.readyDate)}`);
  }

  return parts.join(" • ") || "Current litter information";
}

function buildBannerText(litter) {
  if (litter.bannerText) {
    return litter.bannerText;
  }

  const parts = [];

  if (litter.title) {
    parts.push(`Current litter: ${litter.title}.`);
  }

  if (litter.birthDate) {
    parts.push(`Born ${formatDisplayDate(litter.birthDate)}.`);
  }

  if (litter.readyDate) {
    parts.push(`Ready for new homes by ${formatDisplayDate(litter.readyDate)}.`);
  }

  const priceParts = [];

  if (litter.defaultFemalePrice != null) {
    priceParts.push(`Girls are $${Number(litter.defaultFemalePrice).toLocaleString()}`);
  }

  if (litter.defaultMalePrice != null) {
    priceParts.push(`Boys are $${Number(litter.defaultMalePrice).toLocaleString()}`);
  }

  if (priceParts.length) {
    parts.push(`${priceParts.join(", ")}.`);
  }

  return parts.join(" ").trim();
}

module.exports = {
  buildBannerText,
  buildHeaderSubtitle,
  formatDisplayDate
};
