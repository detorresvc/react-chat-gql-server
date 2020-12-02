import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export default {
  FloatWithDefaultValue: new GraphQLScalarType({
    name: 'FloatWithDefaultValue',
    description: 'Float scalar type with default value 0 if null',

    /**
     * gets invoked to parse client input that was passed through variables.
     * @param value
     * @return {number}
     */
    parseValue(value) {
        return isNaN(value) ? 0 : parseFloat(value);
    },
    /**
     *  gets invoked when serializing the result to send it back to a client.
     * @param value
     * @return {number}
     */
    serialize(value) {
       return isNaN(value) ? 0 : parseFloat(value);
    },

    /**
     * gets invoked to parse client input that was passed inline in the query.
     * @param ast
     * @return {*}
     */
    parseLiteral(ast){
        switch (ast.kind) {
            case Kind.STRING:
            case Kind.INT:
            case Kind.FLOAT:
               return isNaN(ast.value) ? 0 : parseFloat(ast.value);
            default:
                throw new Error("Invalid Float value", ast)
        }
    }
}),
}