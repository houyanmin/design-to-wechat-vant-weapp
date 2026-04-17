#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DOC_SITE_URLS = [
  "https://vant.pro/vant-weapp/",
  "https://vant-ui.github.io/vant-weapp/"
];

const DOMESTIC_DOC_BASE = "https://vant.pro/vant-weapp/";
const GITHUB_DOC_BASE = "https://vant-ui.github.io/vant-weapp/";
const GUIDE_SECTION_TITLE = "开发指南";

const SUBCOMPONENT_DOC_MAP = {
  "cell-group": {
    docPath: "cell",
    note: "`Cell` 文档一起说明"
  },
  "checkbox-group": {
    docPath: "checkbox",
    note: "`Checkbox` 文档一起说明"
  },
  "collapse-item": {
    docPath: "collapse",
    note: "`Collapse` 子项"
  },
  "dropdown-item": {
    docPath: "dropdown-menu",
    note: "`DropdownMenu` 子项"
  },
  "goods-action-button": {
    docPath: "goods-action",
    note: "`GoodsAction` 子项"
  },
  "goods-action-icon": {
    docPath: "goods-action",
    note: "`GoodsAction` 子项"
  },
  "grid-item": {
    docPath: "grid",
    note: "`Grid` 子项"
  },
  "index-anchor": {
    docPath: "index-bar",
    note: "`IndexBar` 子项"
  },
  "picker-column": {
    docPath: "picker",
    note: "`Picker` 内部列实现，通常不直接注册"
  },
  "radio-group": {
    docPath: "radio",
    note: "`Radio` 文档一起说明"
  },
  row: {
    docPath: "col",
    note: "`Layout` 文档同时覆盖 `row` 与 `col`"
  },
  "sidebar-item": {
    docPath: "sidebar",
    note: "`Sidebar` 子项"
  },
  "tabbar-item": {
    docPath: "tabbar",
    note: "`Tabbar` 子项"
  },
  tabs: {
    docPath: "tab",
    note: "`Tab` 文档页同时覆盖 `tabs` 与 `tab`"
  }
};

const INTERNAL_DIR_MAP = {
  definitions: "类型或定义文件，忽略",
  info: "内部辅助能力，无独立公开文档页",
  mixins: "内部复用逻辑，忽略",
  wxs: "内部运行时代码，忽略"
};

const TAG_OVERRIDES = {
  cell: ["van-cell"],
  checkbox: ["van-checkbox", "van-checkbox-group"],
  col: ["van-row", "van-col"],
  collapse: ["van-collapse", "van-collapse-item"],
  common: [],
  "dropdown-menu": ["van-dropdown-menu", "van-dropdown-item"],
  "goods-action": [
    "van-goods-action",
    "van-goods-action-button",
    "van-goods-action-icon"
  ],
  grid: ["van-grid", "van-grid-item"],
  "index-bar": ["van-index-bar", "van-index-anchor"],
  radio: ["van-radio", "van-radio-group"],
  sidebar: ["van-sidebar", "van-sidebar-item"],
  tab: ["van-tabs", "van-tab"],
  tabbar: ["van-tabbar", "van-tabbar-item"]
};

const OUTPUT_FILE = path.resolve(
  __dirname,
  "../references/vant-components-docs.md"
);

function hasProjectMarkers(dirPath) {
  return (
    fs.existsSync(path.join(dirPath, "project.config.json")) &&
    fs.existsSync(path.join(dirPath, "app.json")) &&
    fs.existsSync(path.join(dirPath, "package.json"))
  );
}

function findProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (hasProjectMarkers(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function resolveRootDir() {
  const candidates = [
    process.env.CODEX_WORKSPACE_ROOT,
    process.env.INIT_CWD,
    process.cwd(),
    path.resolve(__dirname, "../../..")
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolvedRoot = findProjectRoot(candidate);

    if (resolvedRoot) {
      return resolvedRoot;
    }
  }

  throw new Error(
    "Could not determine the Mini Program workspace root. Run this script from the project root or a subdirectory of it."
  );
}

const ROOT_DIR = resolveRootDir();

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "winnow-wx-skill-docs-updater"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function getScriptUrlsFromHtml(html, siteUrl) {
  const matches = [
    ...html.matchAll(/<script[^>]+src="([^"]*static\/js\/[^"]+\.js)"/g)
  ];

  return [...new Set(matches.map((match) => new URL(match[1], siteUrl).toString()))];
}

function parseDocsNavFromBundle(bundleText) {
  const matched = bundleText.match(/nav:\[(.*?)\]\}\},a=/s);

  if (!matched) {
    return null;
  }

  return Function(`"use strict"; return ([${matched[1]}]);`)();
}

async function loadDocsNav() {
  const errors = [];

  for (const siteUrl of DOC_SITE_URLS) {
    try {
      const homepageHtml = await fetchText(siteUrl);
      const scriptUrls = getScriptUrlsFromHtml(homepageHtml, siteUrl);

      for (const scriptUrl of scriptUrls) {
        const scriptText = await fetchText(scriptUrl);
        const nav = parseDocsNavFromBundle(scriptText);

        if (nav) {
          return nav;
        }
      }

      errors.push(`No docs nav found in scripts from ${siteUrl}`);
    } catch (error) {
      errors.push(`${siteUrl}: ${error.message}`);
    }
  }

  throw new Error(errors.join("\n"));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getInstalledVantVersion() {
  const installedPackagePath = path.join(
    ROOT_DIR,
    "node_modules",
    "@vant",
    "weapp",
    "package.json"
  );

  if (fs.existsSync(installedPackagePath)) {
    return readJson(installedPackagePath).version;
  }

  const rootPackagePath = path.join(ROOT_DIR, "package.json");
  const packageJson = readJson(rootPackagePath);

  return (
    (packageJson.dependencies && packageJson.dependencies["@vant/weapp"]) ||
    (packageJson.devDependencies && packageJson.devDependencies["@vant/weapp"]) ||
    "unknown"
  );
}

function listVantComponentDirs() {
  const candidateDirs = [
    path.join(ROOT_DIR, "miniprogram_npm", "@vant", "weapp"),
    path.join(ROOT_DIR, "node_modules", "@vant", "weapp", "dist")
  ];

  for (const candidateDir of candidateDirs) {
    if (!fs.existsSync(candidateDir)) {
      continue;
    }

    const dirEntries = fs
      .readdirSync(candidateDir, {
        withFileTypes: true
      })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    if (dirEntries.length) {
      return dirEntries;
    }
  }

  throw new Error("Could not find a local @vant/weapp component directory");
}

function formatMarkdownTag(tagName) {
  return `\`<${tagName}>\``;
}

function getComponentTags(docPath) {
  if (Object.prototype.hasOwnProperty.call(TAG_OVERRIDES, docPath)) {
    return TAG_OVERRIDES[docPath].length
      ? TAG_OVERRIDES[docPath].map(formatMarkdownTag).join("、")
      : "内置样式工具";
  }

  return formatMarkdownTag(`van-${docPath}`);
}

function buildDocLink(baseUrl, docPath) {
  return `${baseUrl}#/${docPath}`;
}

function buildGuideTable(section) {
  const header = [
    `## ${section.title}`,
    "",
    "| 文档页 | 作用 | 国内文档 | GitHub 镜像 |",
    "| --- | --- | --- | --- |"
  ];

  const rows = section.items.map((item) => {
    const domesticLink = buildDocLink(DOMESTIC_DOC_BASE, item.path);
    const githubLink = buildDocLink(GITHUB_DOC_BASE, item.path);

    return `| \`${item.path}\` | ${item.title} | [${item.path}](${domesticLink}) | [${item.path}](${githubLink}) |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function buildComponentTable(section) {
  const header = [
    `## ${section.title}`,
    "",
    "| 文档页 | 组件标签 | 国内文档 | GitHub 镜像 |",
    "| --- | --- | --- | --- |"
  ];

  const rows = section.items.map((item) => {
    const domesticLink = buildDocLink(DOMESTIC_DOC_BASE, item.path);
    const githubLink = buildDocLink(GITHUB_DOC_BASE, item.path);

    return `| \`${item.path}\` | ${getComponentTags(item.path)} | [${item.path}](${domesticLink}) | [${item.path}](${githubLink}) |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function buildSubcomponentTable() {
  const header = [
    "## 子组件与无独立文档页映射",
    "",
    "这些目录在安装包里存在，但官方文档没有单独导航页。skill 遇到它们时，应直接跳到对应父文档页。",
    "",
    "| 组件目录或标签 | 查看文档页 | 说明 |",
    "| --- | --- | --- |"
  ];

  const rows = Object.keys(SUBCOMPONENT_DOC_MAP)
    .sort()
    .map((componentDir) => {
      const mapped = SUBCOMPONENT_DOC_MAP[componentDir];
      const tagName = componentDir === "picker-column" ? "" : ` / \`van-${componentDir}\``;

      return `| \`${componentDir}\`${tagName} | \`${mapped.docPath}\` | ${mapped.note} |`;
    });

  return [...header, ...rows, ""].join("\n");
}

function buildInternalDirsTable() {
  const header = [
    "## 内部目录与忽略项",
    "",
    "这些目录存在于安装包里，但通常不应被当成业务页面直接注册的公共组件：",
    "",
    "| 目录 | 处理建议 |",
    "| --- | --- |"
  ];

  const rows = Object.keys(INTERNAL_DIR_MAP)
    .sort()
    .map((dirName) => `| \`${dirName}\` | ${INTERNAL_DIR_MAP[dirName]} |`);

  return [...header, ...rows, ""].join("\n");
}

function validateLocalDirsAgainstDocs(localDirs, nav) {
  const docPaths = new Set(
    nav
      .filter((section) => section.title !== GUIDE_SECTION_TITLE)
      .flatMap((section) => section.items.map((item) => item.path))
  );

  const unknownDirs = localDirs.filter((dirName) => {
    return (
      !docPaths.has(dirName) &&
      !Object.prototype.hasOwnProperty.call(SUBCOMPONENT_DOC_MAP, dirName) &&
      !Object.prototype.hasOwnProperty.call(INTERNAL_DIR_MAP, dirName)
    );
  });

  if (unknownDirs.length) {
    throw new Error(
      `Found unclassified local @vant/weapp directories:\n${unknownDirs.join("\n")}`
    );
  }
}

function renderMarkdown(nav, version) {
  const sections = [];

  sections.push("# Vant Weapp Components Docs Index");
  sections.push("");
  sections.push("<!-- Generated by scripts/update_vant_components_docs.js -->");
  sections.push("");
  sections.push("这份索引给当前 skill 提供 `@vant/weapp` 官方文档入口，优先用于以下场景：");
  sections.push("");
  sections.push("- 选择该用哪个 `van-` 组件");
  sections.push("- 确认组件是否有独立文档页");
  sections.push("- 判断 `cell-group`、`tabbar-item` 这类子组件该看哪个父文档页");
  sections.push("- 快速打开官方 API、示例和样式说明");
  sections.push("");
  sections.push("## 版本与来源");
  sections.push("");
  sections.push(`- 当前仓库依赖版本：\`@vant/weapp@${version}\``);
  sections.push("- 官方文档根地址：");
  sections.push(`  - 国内站：<${DOMESTIC_DOC_BASE}>`);
  sections.push(`  - GitHub 镜像：<${GITHUB_DOC_BASE}>`);
  sections.push("- 本文件中的独立文档页清单，对齐 Vant Weapp 文档站导航配置");
  sections.push("- 文档直达链接统一使用 `#/path` 路由格式");
  sections.push("");
  sections.push("## 使用规则");
  sections.push("");
  sections.push("1. 如果组件有独立文档页，优先打开该页。");
  sections.push("2. 如果组件只是父组件的子标签，先看“子组件映射”表。");
  sections.push("3. `common` 是内置样式文档，不是 `van-` 组件，但在做样式覆盖时很有用。");
  sections.push("4. `panel` 已被官方标记为废弃，除非维护旧代码，否则不建议新增使用。");
  sections.push("");

  nav.forEach((section) => {
    if (section.title === GUIDE_SECTION_TITLE) {
      sections.push(buildGuideTable(section));
      return;
    }

    sections.push(buildComponentTable(section));
  });

  sections.push(buildSubcomponentTable());
  sections.push(buildInternalDirsTable());
  sections.push("## Skill 使用建议");
  sections.push("");
  sections.push("- 用户提到具体组件名时，先在本文件定位官方文档链接，再决定是否需要读取 `references/vant-patterns.md`");
  sections.push("- 用户提到 `van-tabs`、`van-row`、`van-cell-group` 等没有独立路由的组件时，先查本文件的“子组件映射”");
  sections.push("- 遇到样式覆盖、主题、全局配置问题时，优先补读 `custom-style`、`theme`、`config-provider` 和 `common`");
  sections.push("");

  return sections.join("\n");
}

async function main() {
  const nav = await loadDocsNav();
  const version = getInstalledVantVersion();
  const localDirs = listVantComponentDirs();

  validateLocalDirsAgainstDocs(localDirs, nav);

  const markdown = renderMarkdown(nav, version);
  fs.writeFileSync(OUTPUT_FILE, markdown);

  console.log(`Updated ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
