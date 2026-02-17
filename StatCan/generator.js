import fs from "fs/promises"; // Node 14+ or 16+
import path from "path";
import {SVG_USAGE_MAP, ACTIVITY_ICONS, ACTIVITY_ICON_MAP} from "./icons.js"


function normalizeKey(value) {
  return value
    ?.toString()
    .trim()
    .toLowerCase();
}

// return the html code of SVG
function renderSvg({ href, label, width }) {
  return `
    <svg
      width="${width}"
      height="25"
      role="img"
      aria-label="${label}"
      focusable="false"
    >
      <use href="${href}"></use>
    </svg>
  `;
}

// return the { href, label, width } in both en and fr
function resolveSvg(categoryMap, rawEn, rawFr) {
  // consistant strings
  const enKey = normalizeKey(rawEn);
  const frKey = normalizeKey(rawFr);

  const en = categoryMap[enKey]?.en;
  const fr = categoryMap[frKey]?.fr ? categoryMap[frKey]?.fr: categoryMap[enKey]?.fr;

  return { en, fr };
}

// return the entire svg section
function renderBadgeRow(course) {

  // get the corresponding href, label, width info from SVG_USAGE_MAP 
  // in { en: {...}, fr: {...} }
  const offeredBy = resolveSvg(
    SVG_USAGE_MAP.offeredBy,
    course.OfferedBy,
    course["OfferedBy-fr"]
  );

  const time = resolveSvg(
    SVG_USAGE_MAP.timeToComplete,
    course.TimeToComplete,
    course["TimeToComplete-fr"]
  );

  const delivery = resolveSvg(
    SVG_USAGE_MAP.deliveryMethod,
    course.DeliveryMethod,
    course["DeliveryMethod-fr"]
  );

  const reserve = normalizeKey(course.DeliveryMethod) === "virtual classroom" ? resolveSvg(
      SVG_USAGE_MAP.deliveryMethod,
      "reserve",
      "reserve"
    ) : "";

  const cost = normalizeKey(course.AssociatedCost) === "y" ? resolveSvg(
      SVG_USAGE_MAP.cost,
      "y",
      "y"
    ) : "";

  return `
    {mlang en}
      ${time.en ? renderSvg(time.en) : ""}
      ${offeredBy.en ? renderSvg(offeredBy.en) : ""}
      ${delivery.en ? renderSvg(delivery.en) : ""}
      ${reserve.en ? renderSvg(reserve.en) : ""}
      ${cost.en ? renderSvg(cost.en) : ""}
    {mlang}

    {mlang fr}
      ${time.fr ? renderSvg(time.fr) : ""}
      ${offeredBy.fr ? renderSvg(offeredBy.fr) : ""}
      ${delivery.fr ? renderSvg(delivery.fr) : ""}
      ${cost.fr ? renderSvg(cost.fr) : ""}
    {mlang}
  `;
}

// reture the entire more details section
function renderCollapsibleSection(course, uniqueId) {
  return `<div class="d-flex align-items-center mt-2 p-1">
  <!-- Collapsible Section for Additional Information -->
    <a role="button" data-toggle="collapse" class="btn btn-icon btn-link mr-1 icons-collapse-expand justify-content-center collapsed" onclick="toggleVisibility${uniqueId}(this)" aria-expanded="false" aria-controls="collapsibleContent-${uniqueId}" aria-label="{mlang en}Show Details{mlang}{mlang fr}Afficher les détails{mlang}" tabindex="0">
        <span id="collapseSpan-${uniqueId}" class="pluscontaexpanded-icon icon-no-margin p-2" title="{mlang en}Expand{mlang}{mlang fr}Étendre{mlang}">
            <i id="collapseIcon-${uniqueId}" class="icon fa fa-chevron-right fa-fw" aria-hidden="true"></i>
        </span>
    </a>
    <span id="contentBtn-${uniqueId}" class="activity-add-text">{mlang en}Show Details{mlang}{mlang fr}Afficher les détails{mlang}</span>
</div>
<div id="collapsibleContent-${uniqueId}" class="hidden">
    <div class="flex-fill description-inner text-break">
        <div class="no-overflow">
            <ul class="list-group">
                <li class="list-group-item">
                    {mlang en}Offered By: ${course.OfferedBy} {mlang}{mlang fr}Offert par : ${course["OfferedBy-fr"]} {mlang}
                </li>
                <li class="list-group-item">
                    {mlang en}Time to Complete: ${course.TimeToComplete} {mlang}{mlang fr}Durée : ${course["TimeToComplete-fr"]} {mlang}
                </li>
                <li class="list-group-item">
                    {mlang en}Delivery Method: ${course.DeliveryMethod} {mlang}{mlang fr}Méthode de formation : ${course["DeliveryMethod-fr"]} {mlang}
                </li>
                <li class="list-group-item">
                    {mlang en}Associated Cost: ${course.AssociatedCost} {mlang}{mlang fr}Coût associé : ${course["AssociatedCost-fr"]} {mlang}
                </li>
            </ul>
        </div>
    </div>
</div>
<script>
    function toggleVisibility${uniqueId}(toggleButton) {
        var content = document.getElementById("collapsibleContent-${uniqueId}");
        const toggleIcon = document.getElementById("collapseIcon-${uniqueId}");
        const toggleSpan = document.getElementById("collapseSpan-${uniqueId}");
        const toggleBtn = document.getElementById("contentBtn-${uniqueId}");

        if (content.classList.contains("hidden")) {
            content.className = "activity-altcontent small d-flex";
            toggleBtn.textContent = "{mlang en}Hide Details{mlang}{mlang fr}Masquer les détails{mlang}";
            toggleIcon.className = "icon fa fa-chevron-down fa-fw";
            toggleSpan.setAttribute('title', "{mlang en}Collapse{mlang}{mlang fr}Réduire{mlang}");
            toggleButton.setAttribute('aria-expanded', 'true');
            toggleButton.setAttribute('aria-label', "{mlang en}Hide Details{mlang}{mlang fr}Masquer les détails{mlang}");
        } else {
            content.className = "hidden";
            toggleIcon.className = "icon fa fa-chevron-right fa-fw";
            toggleBtn.textContent = "{mlang en}Show Details{mlang}{mlang fr}Afficher les détails{mlang}";
            toggleSpan.setAttribute('title', "{mlang en}Expand{mlang}{mlang fr}Étendre{mlang}");
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.setAttribute('aria-label', "{mlang en}Show Details{mlang}{mlang fr}Afficher les détails{mlang}");
        }
    }
</script>
  `;
}

// return the course html
function renderCourseActivity(course, id) {
  return `

<!-- ${course.name} -->

<div class="activity-instance d-flex flex-column">
  <div class="activitytitle media modtype_url position relative align-self-start">
    <div class="btn-link align-self-start mr-3 p-3 rounded-circle">
      ${ACTIVITY_ICON_MAP[normalizeKey(course.DeliveryMethod)]}
    </div>

    <div class="media-body align-self-center">
      <div>
        <a
          class="text-decoration-none"
          href="{mlang en}${course.link}{mlang}{mlang fr}${course["link-fr"]}{mlang}"
          target="_blank"
          aria-label="{mlang en}${course.name}, opens in new tab{mlang}{mlang fr}${course["name-fr"]}, ouvre dans un nouvel onglet{mlang}"
        >
          <h4><u>{mlang en}${course.name}{mlang}{mlang fr}${course["name-fr"]}{mlang}</u></h4>
        </a>

        ${renderBadgeRow(course)}
      </div>
    </div>
  </div>
</div>
${renderCollapsibleSection(course, id)}
`;
}


async function loadData() {
  try {
    // Resolve file paths relative to this script
    const coursesPath = path.resolve("./courses.json");

    // Read files
    const coursesData = await fs.readFile(coursesPath, "utf-8");

    // Parse JSON
    const courses = JSON.parse(coursesData);

    // Return both
    return courses;

  } catch (err) {
    console.error("Error loading data:", err);
    return { courses: [], SVG_USAGE_MAP: {} };
  }
}

// Usage: store the HTML string
(async () => {
  const courses = await loadData();
  const coursesHTML = courses
  .map((course, index) => {
    const uniqueId = Date.now() + index; // guaranteed unique per run
    return renderCourseActivity(course, uniqueId)
  })
  .join("\n");
  // Now `coursesHTML` contains all your HTML for the courses
  // You can save it, send it to a server, or write to a file in Node
  await saveHtmlToFile(coursesHTML, "output.html");
})();

async function saveHtmlToFile(htmlString, outputFile = "courses.html") {
  try {
    const filePath = path.resolve(outputFile);
    await fs.writeFile(filePath, htmlString, "utf-8");
    console.log(`HTML successfully written to ${filePath}`);
  } catch (err) {
    console.error("Error writing HTML file:", err);
  }
}
