import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type MaintenanceProject = {
  areaSquareMeters: number | null;
  businessStage: string;
  businessStageOrder: number;
  details: {
    architecturalReviewDate?: string;
    constructionStartDate?: string;
    implementationApprovalDate?: string;
    managementDispositionDate?: string;
    memberCount?: number | null;
    note?: string;
    ownerCount?: number | null;
    residentAgreementDate?: string;
  };
  districtName: string;
  id: string;
  legalStatus: string;
  location: string;
  normalizedName: string;
  officialUrl: string;
  projectName: string;
  projectType: string;
  rawStage: string;
  regionCode: "28";
  sourceBaseDate: string;
  sourceDataset: string;
  sourceProvider: "인천광역시";
  sourceRecordId: string;
};

type MaintenanceCollection = {
  projects: MaintenanceProject[];
  total: number;
  type: "LandViewMaintenanceProjectCollection";
};

let collectionPromise: Promise<MaintenanceCollection> | null = null;

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\([^)]*\)/g, "")
    .replace(
      /(?:주택정비형|도시정비형|소규모|가로주택|주택)?(?:재개발|재건축)?(?:정비사업)?(?:지구단위계획)?(?:사업)?(?:구역|지구)$/g,
      ""
    )
    .replace(/[^0-9a-z가-힣]/g, "");
}

async function loadCollection() {
  if (!collectionPromise) {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "incheon-maintenance-projects.json"
    );
    collectionPromise = readFile(filePath, "utf8").then(
      (contents) => JSON.parse(contents) as MaintenanceCollection
    );
  }

  return collectionPromise;
}

export async function findIncheonMaintenanceProject(projectName: string) {
  const collection = await loadCollection();
  const target = normalizeName(projectName);

  if (target.length < 2) {
    return null;
  }

  const exactMatches = collection.projects.filter(
    (project) => project.normalizedName === target
  );

  if (exactMatches.length === 1) {
    return { ...exactMatches[0], matchConfidence: "exact" as const };
  }

  const normalizedMatches = collection.projects.filter((project) => {
    if (project.normalizedName.length < 4 || target.length < 4) {
      return false;
    }

    return (
      project.normalizedName.includes(target) || target.includes(project.normalizedName)
    );
  });

  if (normalizedMatches.length === 1) {
    return { ...normalizedMatches[0], matchConfidence: "normalized" as const };
  }

  return null;
}
