import type { ApplicationRecord } from './model'
export default function ApplicationSummary({
  application,
}: {
  application: ApplicationRecord
}) {
  const institution = application.institutionDetails
  const details = application.applicationDetails
  return (
    <div className="application-summary">
      <section>
        <h2>Institution Information</h2>
        <dl>
          {[
            ['Institution', institution.institutionName],
            ['Type', institution.institutionType],
            ['Contact person', institution.contactPerson],
            ['Email', institution.email],
            ['Phone', institution.phone],
            ['State', institution.state],
            ['City', institution.city],
            ['Address', institution.address],
            ['PIN code', institution.pincode],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'Not entered'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>Application Details</h2>
        <dl>
          {[
            ['Reference', application.referenceNumber],
            ['Application type', application.type],
            ['Academic year', application.academicYear],
            ['Institution code', details.institutionCode],
            ['Affiliating university', details.universityAffiliation],
            ['Established', details.establishmentYear],
            ['Existing approval reference', details.existingApprovalReference],
            ['Proposed student intake', details.proposedIntake?.toString()],
            ['Remarks', details.remarks],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'Not entered'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
