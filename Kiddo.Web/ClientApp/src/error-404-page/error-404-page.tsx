import { Text, mergeStyleSets } from "@fluentui/react";
import { useTitleEffect } from "../common/title";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr",
    overflow: "hidden",
    justifyItems: "center"
  },
  header: {
    margin: "50px 0 50px 0"
  }
});

export default function Error404Page() {
  useTitleEffect("404");

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">404 Not Found</Text>
    </div>
  );
}