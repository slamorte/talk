import React from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { withPaginationContainer } from "talk-framework/lib/relay";
import { PropTypesOf } from "talk-framework/types";
import { ReplyListContainer_comment as Data } from "talk-stream/__generated__/ReplyListContainer_comment.graphql";
import {
  COMMENT_SORT,
  ReplyListContainerPaginationQueryVariables,
} from "talk-stream/__generated__/ReplyListContainerPaginationQuery.graphql";

import ReplyList from "../components/ReplyList";

export interface InnerProps {
  comment: Data;
  relay: RelayPaginationProp;
}

export class ReplyListContainer extends React.Component<InnerProps> {
  public state = {
    disableShowAll: false,
  };

  public render() {
    if (
      this.props.comment.replies === null ||
      this.props.comment.replies.edges.length === 0
    ) {
      return null;
    }
    const comments = this.props.comment.replies.edges.map(edge => edge.node);
    return (
      <ReplyList
        commentID={this.props.comment.id}
        comments={comments}
        onShowAll={this.showAll}
        hasMore={this.props.relay.hasMore()}
        disableShowAll={this.state.disableShowAll}
      />
    );
  }

  private showAll = () => {
    if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
      return;
    }

    this.setState({ disableShowAll: true });
    this.props.relay.loadMore(
      999999999, // Fetch All Replies
      error => {
        this.setState({ disableShowAll: false });
        if (error) {
          // tslint:disable-next-line:no-console
          console.error(error);
        }
      }
    );
  };
}

// TODO: (cvle) This should be autogenerated.
interface FragmentVariables {
  count: number;
  cursor?: string;
  orderBy: COMMENT_SORT;
}

const enhanced = withPaginationContainer<
  { comment: Data },
  InnerProps,
  FragmentVariables,
  ReplyListContainerPaginationQueryVariables
>(
  {
    comment: graphql`
      fragment ReplyListContainer_comment on Comment
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 5 }
          cursor: { type: "Cursor" }
          orderBy: { type: "COMMENT_SORT!", defaultValue: CREATED_AT_ASC }
        ) {
        id
        replies(first: $count, after: $cursor, orderBy: $orderBy)
          @connection(key: "ReplyList_replies") {
          edges {
            node {
              id
              ...CommentContainer
            }
          }
        }
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.comment && props.comment.replies;
    },
    // This is also the default implementation of `getFragmentVariables` if it isn't provided.
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        commentID: props.comment.id,
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query ReplyListContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
        $orderBy: COMMENT_SORT!
        $commentID: ID!
      ) {
        comment(id: $commentID) {
          ...ReplyListContainer_comment
            @arguments(count: $count, cursor: $cursor, orderBy: $orderBy)
        }
      }
    `,
  }
)(ReplyListContainer);

export type ReplyListContainerProps = PropTypesOf<typeof enhanced>;
export default enhanced;