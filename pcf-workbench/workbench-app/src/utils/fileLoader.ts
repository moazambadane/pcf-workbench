export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

export function isManifestFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xml") && name.includes("manifest");
}

export function isBundleFile(file: File): boolean {
  const name = file.name.toLowerCase();
  // Accept bundle.js but not bundle.js.map
  return name === "bundle.js";
}

// Known platform-library UMD file name patterns → canonical library name
const PLATFORM_LIB_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /fluentui-react(\.min)?\.js$/i,     name: "Fluent" },
  { pattern: /fluentui-react\.umd(\.min)?\.js$/i, name: "Fluent" },
];

export function isPlatformLibFile(file: File): string | null {
  const name = file.name.toLowerCase();
  for (const { pattern, name: libName } of PLATFORM_LIB_PATTERNS) {
    if (pattern.test(name)) return libName;
  }
  return null;
}

export function classifyFiles(files: File[]): {
  manifest?: File;
  bundle?: File;
  cssFiles: File[];
  platformLibFiles: File[];
  others: File[];
} {
  let manifest: File | undefined;
  let bundle: File | undefined;
  const cssFiles: File[] = [];
  const platformLibFiles: File[] = [];
  const others: File[] = [];

  for (const file of files) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
    const name = file.name.toLowerCase();
    const relLower = relativePath.toLowerCase();

    if (!manifest && isManifestFile(file)) {
      manifest = file;
    } else if (!bundle && isBundleFile(file)) {
      bundle = file;
    } else if (name.endsWith(".css") && !relLower.includes("node_modules")) {
      cssFiles.push(file);
    } else if (isPlatformLibFile(file)) {
      platformLibFiles.push(file);
    } else {
      others.push(file);
    }
  }

  return { manifest, bundle, cssFiles, platformLibFiles, others };
}
