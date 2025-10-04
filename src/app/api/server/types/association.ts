export enum AssociationType {
  Normal = 'שיוך',
  Subject = 'נושא',
}

export interface Association {
  id?: string;
  name: string;
  type: AssociationType;
  associatedSchools: string[];
  associatedUsers: string[];
}

export const getAssociationTypeKey = (associationType?: AssociationType): keyof AssociationType | undefined => {
    const associationTypeKey = Object.entries(AssociationType).find(([,value]) => value === associationType)?.[0];

    return associationTypeKey as keyof AssociationType;
}