import { Data } from '../common/data.js';

export type InputDescriptor = {
  readonly id: string;
  readonly name?: string;
  readonly purpose?: string;
  readonly constraints?: {
    readonly fields?: readonly {
      readonly path: readonly string[];
      readonly filter?: Readonly<Record<string, unknown>>;
    }[];
  };
};

export type SubmissionRequirement = {
  readonly rule: string;
  readonly count?: number;
  readonly from_nested?: readonly {
    readonly name: string;
    readonly rule: string;
    readonly group: readonly string[];
  }[];
};

export type PresentationDefinition = {
  readonly id: string;
  readonly input_descriptors: readonly InputDescriptor[];
  readonly submission_requirements?: readonly SubmissionRequirement[];
};

export type PresentationDefinitionRequest = {
  readonly response_type: 'vp_token';
  readonly response_mode: 'direct_post';
  readonly client_id: string;
  readonly nonce: string;
  readonly presentation_definition: PresentationDefinition;
};

export function presentationDefinitionSaid(pd: PresentationDefinition): string {
  return Data.digestFor(pd);
}
