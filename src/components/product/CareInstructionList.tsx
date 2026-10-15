import FeatureInputList from './FeatureInputList'
import { PRODUCT } from '../../utils/catalogValidation'

interface CareInstructionListProps {
  instructions: string[]
  onChange: (instructions: string[]) => void
  error?: string
}

export default function CareInstructionList({ instructions, onChange, error }: CareInstructionListProps) {
  return (
    <FeatureInputList
      features={instructions}
      onChange={onChange}
      label="Care Instructions"
      placeholder="e.g. Avoid water exposure"
      addLabel="Add Instruction"
      maxItems={PRODUCT.maxCare}
      maxLength={PRODUCT.careMax}
      error={error}
    />
  )
}
