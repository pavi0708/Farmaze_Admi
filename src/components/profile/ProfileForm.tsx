
import React from "react";
import EditableField from "./EditableField";
import UserPhotoSection from "./UserPhotoSection";

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  postCode: string;
  photo: string | null;
}

interface ProfileFormProps {
  profile: UserProfile;
  formValues: UserProfile;
  editing: {[key: string]: boolean};
  toggleEdit: (field: keyof UserProfile) => void;
  handleInputChange: (field: keyof UserProfile, value: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  formValues,
  editing,
  toggleEdit,
  handleInputChange
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-12">
      <UserPhotoSection photo={profile.photo} displayName={profile.displayName} />

      <div className="lg:w-3/4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Display Name"
            value={editing.displayName ? formValues.displayName : profile.displayName}
            isEditing={editing.displayName}
            onToggleEdit={() => toggleEdit('displayName')}
            onChange={(value) => handleInputChange('displayName', value)}
          />

          <EditableField
            label="Email"
            value={editing.email ? formValues.email : profile.email}
            isEditing={editing.email}
            onToggleEdit={() => toggleEdit('email')}
            onChange={(value) => handleInputChange('email', value)}
            type="email"
          />

          <EditableField
            label="Phone Number"
            value={editing.phone ? formValues.phone : profile.phone}
            isEditing={editing.phone}
            onToggleEdit={() => toggleEdit('phone')}
            onChange={(value) => handleInputChange('phone', value)}
            type="tel"
          />

          <EditableField
            label="Post Code"
            value={editing.postCode ? formValues.postCode : profile.postCode}
            isEditing={editing.postCode}
            onToggleEdit={() => toggleEdit('postCode')}
            onChange={(value) => handleInputChange('postCode', value)}
          />
        </div>

        <EditableField
          label="Address"
          value={editing.address ? formValues.address : profile.address}
          isEditing={editing.address}
          onToggleEdit={() => toggleEdit('address')}
          onChange={(value) => handleInputChange('address', value)}
        />

        <EditableField
          label="Address Line 2"
          value={editing.address2 ? formValues.address2 : profile.address2}
          isEditing={editing.address2}
          onToggleEdit={() => toggleEdit('address2')}
          onChange={(value) => handleInputChange('address2', value)}
        />
      </div>
    </div>
  );
};

export default ProfileForm;
