import { useEffect, useState, FunctionComponent } from "react";
import { Text, mergeStyleSets } from "@fluentui/react";

import { useTitleEffect } from "../common/title";
import { Api } from "../api/api";
import { ApplicationInfo } from "../api/app";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr min-content",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  infoWrapper: {
    display: "grid",
    justifyContent: "center",
    gridTemplateColumns: "min-content"
  },
  info: {
    display: "grid",
    gridTemplateColumns: "min-content min-content",
    cursor: "default",
    gridColumnGap: 16,
    gridRowGap: 16
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    textAlign: "right"
  },
  dataCell: {
    whiteSpace: "nowrap"
  },
  copyright: {
    textAlign: "center"
  }
});

const AppInfo: FunctionComponent<{ info: ApplicationInfo | null }> = ({ info }) => {
  if (info == null) return (<div></div>);

  return (
    <div className={pageStyles.infoWrapper}>
      <div className={pageStyles.info}>
        <Text className={pageStyles.headerCell}>Version</Text>
        <Text className={pageStyles.dataCell}>{info.version}</Text>
        <Text className={pageStyles.headerCell}>User Id</Text>
        <Text className={pageStyles.dataCell}>{info.userId}</Text>
        <Text className={pageStyles.headerCell}>Display name</Text>
        <Text className={pageStyles.dataCell}>{info.displayName}</Text>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [info, setInfo] = useState<ApplicationInfo | null>(null);

  useTitleEffect("About");

  useEffect(() => {
    (async () => {
      let newInfo = await Api.app.getApplicationInfo();
      setInfo(newInfo);
    })();
  }, [setInfo]);

  return (
    <div className={pageStyles.page}>
      <AppInfo info={info} />
      <div></div>
      <div className={pageStyles.copyright}><Text>Kiddo - Copyright Kyle Evans 2021 - 2022</Text></div>
    </div>
  );
}