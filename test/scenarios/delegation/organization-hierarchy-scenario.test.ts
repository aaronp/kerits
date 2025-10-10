/**
 * Scenario Test: Organization with Department AIDs
 *
 * Real-world scenario demonstrating:
 * - Company root AID
 * - Multiple department AIDs delegated to company
 * - Organizational hierarchy structure
 * - Multiple children per parent
 *
 * See: docs/DELEGATION-SCENARIOS.md#scenario-2
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../../src/incept';

describe('Scenario: Organization with Department AIDs', () => {
  test('Step 1: Company creates root AID with executive control', () => {
    const techCorpRoot = incept({
      keys: [
        'DCEO_Key_TechCorp',
        'DCFO_Key_TechCorp',
        'DCTO_Key_TechCorp',
      ],
      ndigs: [
        'ECEO_Next_TechCorp',
        'ECFO_Next_TechCorp',
        'ECTO_Next_TechCorp',
      ],
      isith: '2',  // 2-of-3 executive approval
      nsith: '2',
    });

    expect(techCorpRoot.ked.t).toBe('icp');
    expect(techCorpRoot.ked.kt).toBe('2');
    expect(techCorpRoot.ked.k).toHaveLength(3);
    expect(techCorpRoot.ked.di).toBeUndefined();  // Root, not delegated
  });

  test('Step 2: Create Engineering Department AID', () => {
    const companyAID = 'ETechCorp_Root_AID_123456789_CompanyRoot';

    const engineeringDept = incept({
      keys: [
        'DEngineering_Manager_Key',
        'DEngineering_Lead_Key',
      ],
      ndigs: [
        'EEngineering_Manager_Next',
        'EEngineering_Lead_Next',
      ],
      isith: '2',
      nsith: '2',
      delpre: companyAID,  // Delegated to TechCorp
    });

    expect(engineeringDept.ked.t).toBe('dip');
    expect(engineeringDept.ked.di).toBe(companyAID);
    expect(engineeringDept.ked.kt).toBe('2');
  });

  test('Step 3: Create Sales Department AID', () => {
    const companyAID = 'ETechCorp_Root_AID_123456789_CompanyRoot';

    const salesDept = incept({
      keys: ['DSales_Manager_Key_TechCorp_Sales_Dept'],
      ndigs: ['ESales_Manager_Next_Key_For_Rotation'],
      delpre: companyAID,  // Also delegated to TechCorp
    });

    expect(salesDept.ked.t).toBe('dip');
    expect(salesDept.ked.di).toBe(companyAID);
  });

  test('Step 4: Verify organizational hierarchy', () => {
    const techCorp = incept({
      keys: ['DCEO', 'DCFO', 'DCTO'],
      ndigs: ['ECEO_Next', 'ECFO_Next', 'DCTO_Next'],
      isith: '2',
      nsith: '2',
    });

    const engineering = incept({
      keys: ['DEngineering_Manager', 'DEngineering_Lead'],
      ndigs: ['EEngineering_Manager_Next', 'EEngineering_Lead_Next'],
      isith: '2',
      nsith: '2',
      delpre: techCorp.pre,
    });

    const sales = incept({
      keys: ['DSales_Manager'],
      ndigs: ['ESales_Manager_Next'],
      delpre: techCorp.pre,
    });

    // Verify hierarchy structure
    expect(techCorp.ked.di).toBeUndefined();  // Root
    expect(engineering.ked.di).toBe(techCorp.pre);  // Child
    expect(sales.ked.di).toBe(techCorp.pre);  // Child

    // All departments have same parent
    expect(engineering.ked.di).toBe(sales.ked.di);

    // But departments have unique AIDs
    expect(engineering.pre).not.toBe(sales.pre);
    expect(engineering.pre).not.toBe(techCorp.pre);
    expect(sales.pre).not.toBe(techCorp.pre);
  });

  test('Real-world outcome: Organizational structure established', () => {
    const techCorp = incept({
      keys: ['DCEO', 'DCFO', 'DCTO'],
      ndigs: ['ECEO_N', 'ECFO_N', 'DCTO_N'],
      isith: '2',
      nsith: '2',
    });

    const engineering = incept({
      keys: ['DEng_Mgr', 'DEng_Lead'],
      ndigs: ['EEng_Mgr_N', 'EEng_Lead_N'],
      isith: '2',
      nsith: '2',
      delpre: techCorp.pre,
    });

    const sales = incept({
      keys: ['DSales_Mgr'],
      ndigs: ['ESales_Mgr_N'],
      delpre: techCorp.pre,
    });

    const marketing = incept({
      keys: ['DMarketing_Mgr'],
      ndigs: ['EMarketing_Mgr_N'],
      delpre: techCorp.pre,
    });

    // ✅ Centralized control - company is root
    expect(techCorp.ked.di).toBeUndefined();

    // ✅ Multiple departments under company
    const departments = [engineering, sales, marketing];
    for (const dept of departments) {
      expect(dept.ked.di).toBe(techCorp.pre);
      expect(dept.ked.t).toBe('dip');
    }

    // ✅ Department autonomy - each has own keys
    expect(engineering.ked.k).not.toEqual(sales.ked.k);
    expect(sales.ked.k).not.toEqual(marketing.ked.k);

    // ✅ Audit trail - all departments reference same parent
    const allDelegatedTo = departments.map((d) => d.ked.di);
    expect(new Set(allDelegatedTo).size).toBe(1);  // All same parent
  });

  test('Adding new department later', () => {
    const techCorp = incept({
      keys: ['DCEO', 'DCFO', 'DCTO'],
      ndigs: ['ECEO_N', 'ECFO_N', 'DCTO_N'],
      isith: '2',
      nsith: '2',
    });

    const engineering = incept({
      keys: ['DEng'],
      ndigs: ['EEng_N'],
      delpre: techCorp.pre,
    });

    const sales = incept({
      keys: ['DSales'],
      ndigs: ['ESales_N'],
      delpre: techCorp.pre,
    });

    // Later: Add new HR department
    const hr = incept({
      keys: ['DHR_Director'],
      ndigs: ['EHR_Director_Next'],
      delpre: techCorp.pre,
    });

    // New department follows same pattern
    expect(hr.ked.t).toBe('dip');
    expect(hr.ked.di).toBe(techCorp.pre);

    // All departments still have same parent
    expect(engineering.ked.di).toBe(techCorp.pre);
    expect(sales.ked.di).toBe(techCorp.pre);
    expect(hr.ked.di).toBe(techCorp.pre);
  });

  test('Department with multi-sig control', () => {
    const techCorp = incept({
      keys: ['DCEO', 'DCFO'],
      ndigs: ['ECEO_N', 'ECFO_N'],
      isith: '2',
      nsith: '2',
    });

    // Engineering with 3-of-5 senior engineers
    const engineering = incept({
      keys: [
        'DSenior_Eng_1',
        'DSenior_Eng_2',
        'DSenior_Eng_3',
        'DSenior_Eng_4',
        'DSenior_Eng_5',
      ],
      ndigs: [
        'ESenior_Eng_1_N',
        'ESenior_Eng_2_N',
        'DSenior_Eng_3_N',
        'ESenior_Eng_4_N',
        'ESenior_Eng_5_N',
      ],
      isith: '3',  // 3-of-5
      nsith: '3',
      delpre: techCorp.pre,
    });

    expect(engineering.ked.t).toBe('dip');
    expect(engineering.ked.di).toBe(techCorp.pre);
    expect(engineering.ked.kt).toBe('3');
    expect(engineering.ked.k).toHaveLength(5);
  });

  test('Edge case: Root cannot be delegated', () => {
    // Attempting to create root with delpre doesn't make sense
    const invalidRoot = incept({
      keys: ['DCEO'],
      ndigs: ['ECEO_N'],
      delpre: 'ESomeOtherAID',  // Root shouldn't be delegated
    });

    // It creates a delegated inception, but logically this is a child, not root
    expect(invalidRoot.ked.t).toBe('dip');
    expect(invalidRoot.ked.di).toBe('ESomeOtherAID');
  });
});
