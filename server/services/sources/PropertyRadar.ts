import { DataSource, LeadRecord } from './DataSource.js'

// Phase 2 stub
export class PropertyRadarSource implements DataSource {
  async fetch(): Promise<LeadRecord[]> {
    throw new Error('Not implemented — Phase 2')
  }
}
