import { useContext, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Body,
  ButtonDanger,
  ButtonNegative,
  ButtonPositive,
  ButtonRow,
  ErrorMessage,
  Gap,
  Input,
} from "../../../components/Components";
import { DropDownList } from "../../../components/DropDown";
import { HomeButton } from "../../../components/HomeButton";
import { ArrowDownIcon, DeleteIcon } from "../../../components/Icons";
import { TonProviderContext, WalletStateContext } from "../../../context";
import {
  useDeleteWalletMutation,
  useUpdateWalletMutation,
} from "../../../lib/state/account";
import { WalletState, WalletVersion } from "../../../lib/state/wallet";
import { AppRoute, relative } from "../../../routes";

const Title = styled.div`
  font-size: x-large;
  margin: ${(props) => props.theme.padding} 0;
`;

const Text = styled.div`
  font-size: medium;
  margin-top: ${(props) => props.theme.padding};
`;

const Label = styled.div`
  margin: 40px 0 10px;
`;

const Select = styled.div`
  font-size: medium;
  padding: 5px 0;
  border-bottom: 1px solid ${(props) => props.theme.darkGray};
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const Button = styled(ButtonDanger)`
  width: 100%;
`;
const bounceableOptions = ["Bounceable", "Non Bounceable"];

enum WalletRoutes {
  index = "/",
  mnemonic = "/mnemonic",
  delete = "/delete",
}

const SettingsIndex = () => {
  const navigate = useNavigate();
  const wallet = useContext(WalletStateContext);
  const ton = useContext(TonProviderContext);

  const { mutateAsync, reset } = useUpdateWalletMutation();
  const onChange = async (fields: Partial<WalletState>) => {
    reset();
    await mutateAsync(fields);
  };

  return (
    <>
      <HomeButton />
      <Body>
        <Title>Wallet Settings</Title>

        <Label>Address</Label>
        <DropDownList
          options={bounceableOptions}
          renderOption={(value) => value}
          onSelect={(value) =>
            onChange({ isBounceable: value === bounceableOptions[0] })
          }
        >
          <Select>
            {wallet.isBounceable ? bounceableOptions[0] : bounceableOptions[1]}{" "}
            <ArrowDownIcon />
          </Select>
        </DropDownList>

        <Label>Version</Label>
        <DropDownList
          options={Object.keys(ton.wallet.all)}
          renderOption={(value) => value}
          onSelect={(version) =>
            onChange({ version: version as WalletVersion })
          }
        >
          <Select>
            {wallet.version} <ArrowDownIcon />
          </Select>
        </DropDownList>

        <Label>Reveal Secret Recovery Phrase</Label>
        <Button onClick={() => navigate(relative(WalletRoutes.mnemonic))}>
          Reveal Secret Recovery Phrase
        </Button>

        <Label>Delete Wallet</Label>
        <Button onClick={() => navigate(relative(WalletRoutes.delete))}>
          Delete Wallet <DeleteIcon />
        </Button>
      </Body>
    </>
  );
};

// Your private Secret Recovery Phrase

const SettingsMnemonic = () => {
  const navigate = useNavigate();

  const [value, setValue] = useState("");

  return (
    <Body>
      <Title>Secret Recovery Phrase</Title>
      <Text>
        If you ever change browsers or move computers, you will need this Secret
        Recovery Phrase to access your wallet. Save them somewhere safe and
        secret.
      </Text>
      <ErrorMessage>
        DO NOT share this phrase with anyone!
        <br />
        These words can be used to steal your wallet.
      </ErrorMessage>
      <Text>Enter password to continue</Text>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />

      <Gap />
      <ButtonRow>
        <ButtonNegative onClick={() => navigate(AppRoute.wallet)}>
          Cancel
        </ButtonNegative>
        <ButtonPositive>Next</ButtonPositive>
      </ButtonRow>
    </Body>
  );
};

const SettingsDelete = () => {
  const navigate = useNavigate();
  const { mutateAsync, isLoading } = useDeleteWalletMutation();

  const onDelete = async () => {
    await mutateAsync();
    navigate(AppRoute.home);
  };

  return (
    <Body>
      <Title>Delete Wallet</Title>
      <Text>Deleting your wallet will clear all local stored data.</Text>
      <Text>The wallet could be re-enter by Secret Recovery Phrase.</Text>
      <Text>
        TonMask team cannot recover your wallet Secret Recovery Phrase.
      </Text>
      <Gap />
      <ButtonRow>
        <ButtonNegative
          onClick={() => navigate(AppRoute.wallet)}
          disabled={isLoading}
        >
          Cancel
        </ButtonNegative>
        <ButtonPositive onClick={onDelete} disabled={isLoading}>
          Delete
        </ButtonPositive>
      </ButtonRow>
    </Body>
  );
};

export const WalletSettings = () => {
  return (
    <Routes>
      <Route path={WalletRoutes.mnemonic} element={<SettingsMnemonic />} />
      <Route path={WalletRoutes.delete} element={<SettingsDelete />} />
      <Route path={WalletRoutes.index} element={<SettingsIndex />} />
    </Routes>
  );
};
