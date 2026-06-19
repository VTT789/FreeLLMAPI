/**
 * export-catalog — build the signed catalog product from the live freeapi DB.
 */

import fs from 'fs';
import path from 'path';

import { initDb, getDb } from '../db/index.js';
import { getAllProviders } from '../providers/index.js';
import {
  resolveQuirksByModel,
  quirkKey,
  listQuirkDefinitions
} from '../services/quirks.js';


// Docker / Render compatible
const SUITE_ROOT = process.cwd();


function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}


function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}


function dateVersion(d = new Date()): string {

  const yyyy = d.getUTCFullYear();

  const mm = String(
    d.getUTCMonth() + 1
  ).padStart(2, '0');

  const dd = String(
    d.getUTCDate()
  ).padStart(2, '0');

  return `${yyyy}.${mm}.${dd}`;
}



interface ModelRow {

  platform:string;

  model_id:string;

  display_name:string;

  intelligence_rank:number;

  speed_rank:number;

  size_label:string;

  rpm_limit:number|null;

  rpd_limit:number|null;

  tpm_limit:number|null;

  tpd_limit:number|null;

  monthly_token_budget:string;

  context_window:number|null;

  enabled:number;

  supports_vision:number;

  supports_tools:number;

}



function main() {


  const dbPath = arg('db');


  const tier =
    (arg('tier') as
      | 'live'
      | 'monthly'
      | undefined
    ) ?? 'live';



  const version =
    arg('version') ?? dateVersion();



  if(flag('stdout')) {

    console.log = console.error;

  }



  initDb(dbPath);


  const db = getDb();



  const models =
    db.prepare(
`
SELECT 
platform,
model_id,
display_name,
intelligence_rank,
speed_rank,
size_label,
rpm_limit,
rpd_limit,
tpm_limit,
tpd_limit,
monthly_token_budget,
context_window,
enabled,
supports_vision,
supports_tools

FROM models

ORDER BY 
intelligence_rank ASC,
platform ASC,
model_id ASC
`
    )
    .all() as ModelRow[];




  const quirksByModel =
    resolveQuirksByModel(db);



  const quirkDefs =
    listQuirkDefinitions(db);




  const livePlatforms =
    new Set(
      models.map(
        m => m.platform
      )
    );



  const platforms =
    getAllProviders()

      .filter(
        p =>
          p.platform !== 'custom'
          &&
          livePlatforms.has(
            p.platform
          )
      )

      .map(
        p => ({
          id:p.platform,
          name:p.name
        })
      )

      .sort(
        (a,b)=>
          a.id.localeCompare(b.id)
      );




  const catalogModels =
    models.map(m => ({

      platform:m.platform,

      modelId:m.model_id,

      displayName:m.display_name,


      intelligenceRank:
        m.intelligence_rank,


      speedRank:
        m.speed_rank,


      sizeLabel:
        m.size_label,


      limits:{

        rpm:m.rpm_limit,

        rpd:m.rpd_limit,

        tpm:m.tpm_limit,

        tpd:m.tpd_limit

      },


      monthlyTokenBudget:
        m.monthly_token_budget,


      contextWindow:
        m.context_window,


      enabled:
        m.enabled === 1,


      supportsVision:
        m.supports_vision === 1,


      supportsTools:
        m.supports_tools === 1,



      quirks:

        quirksByModel.get(
          quirkKey(
            m.platform,
            m.model_id
          )
        ) ?? []

    }));





  const catalog = {

    version,

    generatedAt:
      new Date().toISOString(),


    tier,


    counts:{

      platforms:
        platforms.length,


      models:
        catalogModels.length,


      enabledModels:
        catalogModels.filter(
          m=>m.enabled
        ).length,


      quirks:
        quirkDefs.length

    },


    platforms,

    models:catalogModels,

    quirks:quirkDefs

  };





  const json =
    JSON.stringify(
      catalog,
      null,
      2
    ) + '\n';





  if(flag('stdout')) {

    process.stdout.write(json);

    return;

  }





  const outPath =

    arg('out')

    ??

    path.join(

      SUITE_ROOT,

      'catalog',

      'data',

      `catalog.${tier}.json`

    );





  fs.mkdirSync(

    path.dirname(outPath),

    {
      recursive:true
    }

  );





  fs.writeFileSync(

    outPath,

    json

  );





  console.log(

    `Wrote ${tier} catalog ${version}: ` +

    `${catalog.counts.models} models ` +

    `(${catalog.counts.enabledModels} enabled), ` +

    `${catalog.counts.platforms} platforms, ` +

    `${catalog.counts.quirks} quirks -> ${outPath}`

  );

}



main();