export function parser(input: string) {
  return input.split(/\r?\n/).map(tokenize).map(parse);
}

export interface AstTextNode {
  type: "text";
  value: string;
}

export interface AstPlaceholderNode {
  type: "placeholder";
  key: string;
  value?: string;
}

export interface AstCommandNode {
  type: "command";
  name: string;
  args: (AstCommandArgNode | AstPlaceholderNode)[];
}

export interface AstCommandArgNode {
  type: "command-arg";
  value: string;
}

export interface AstRoot {
  node: AstCommandNode | (AstTextNode | AstPlaceholderNode)[];
  wait: number;
}

export type AstNode =
  | AstTextNode
  | AstPlaceholderNode
  | AstCommandNode
  | AstCommandArgNode;

export function parse(tokens: Token[]): AstRoot | null {
  if (tokens.length === 0) return null;

  let wait = 0;
  processWaitStatement();
  if (tokens.length === 0) return null;

  const firstToken = tokens[0];
  if (firstToken.type === "command") {
    return {
      node: {
        type: "command",
        name: firstToken.value,
        args: tokens
          .slice(1)
          .filter((x) => x.type !== "whitespace")
          .map((token) => {
            if (token.type === "placeholder") {
              return {
                type: "placeholder",
                key: token.key,
                value: token.value,
              };
            } else if (token.type === "string") {
              return {
                type: "command-arg",
                value: token.value,
              };
            }
            throw new SyntaxError(`Unexpected token: ${token.type}`);
          }),
      },
      wait,
    };
  }

  return {
    node: tokens
      .map((token): AstTextNode | AstPlaceholderNode => {
        if (token.type === "placeholder") {
          return {
            type: "placeholder",
            key: token.key,
            value: token.value,
          };
        }
        return {
          type: "text",
          value: token.raw,
        };
      })
      .reduce(
        (acc, node, i) => {
          if (i > 0 && node.type === "text" && acc.at(-1)!.type === "text") {
            acc.at(-1)!.value += node.value;
          } else {
            acc.push(node);
          }
          return acc;
        },
        [] as (AstTextNode | AstPlaceholderNode)[]
      ),
    wait,
  };

  function processWaitStatement() {
    // find first wait token
    const waitIndex = tokens.findIndex((token) => token.type === "wait");
    if (waitIndex === -1) {
      return 0;
    }
    wait = (tokens[waitIndex] as { value: number }).value;
    // ignore all tokens after the first wait token and wait token itself
    tokens = tokens.slice(0, waitIndex);
  }
}

type Token = {
  raw: string;
} & (
  | {
      type: "whitespace";
    }
  | {
      type: "command" | "string";
      value: string;
    }
  | {
      type: "placeholder";
      key: string;
      value?: string;
    }
  | {
      type: "wait";
      value: number;
    }
);

export function tokenize(input: string) {
  const re = /^\/(\S+)|"([^"]*)"|<([^>.]+?)(?:\.([^>]+?))?>|(\S)|(\s+)/g;
  type IntrinsicToken = {
    raw: string;
  } & (
    | {
        type: "whitespace" | "text";
      }
    | {
        type: "command" | "string";
        value: string;
      }
    | {
        type: "placeholder";
        key: string;
        value?: string;
      }
    | {
        type: "wait";
        value: number;
      }
  );
  return [...input.matchAll(re)]
    .map(
      ([
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _,
        command,
        string,
        placeholderName,
        placeholderValue,
        text,
        whitespace,
      ]): IntrinsicToken => {
        if (command != null) {
          return {
            type: "command",
            value: command,
            raw: `/${command}`,
          };
        } else if (text != null) {
          return {
            type: "text",
            raw: text,
          };
        } else if (string != null) {
          return {
            type: "string",
            value: string,
            raw: `"${string}"`,
          };
        } else if (whitespace != null) {
          return {
            type: "whitespace",
            raw: whitespace,
          };
        } else if (placeholderName != null) {
          if (placeholderName === "wait") {
            return {
              type: "wait",
              value:
                placeholderValue != null
                  ? Math.round(parseFloat(placeholderValue))
                  : 1,
              raw: `<${placeholderName}${placeholderValue != null ? `.${placeholderValue}` : ""}>`,
            };
          } else {
            return {
              type: "placeholder",
              key: placeholderName,
              value: placeholderValue,
              raw: `<${placeholderName}${placeholderValue != null ? `.${placeholderValue}` : ""}>`,
            };
          }
        }
        throw new Error("should not reach here");
      }
    )
    .reduce((acc, token, i) => {
      if (i > 0 && token.type === "text" && acc.at(-1)!.type === "text") {
        acc.at(-1)!.raw += token.raw;
      } else {
        acc.push(token);
      }
      return acc;
    }, [] as IntrinsicToken[])
    .map((token): Token => {
      if (token.type === "text") {
        return {
          type: "string",
          value: token.raw,
          raw: token.raw,
        };
      }
      return token as Token;
    });
}
