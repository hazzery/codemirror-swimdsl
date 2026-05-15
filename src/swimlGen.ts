@top SwimProgramme { statement* }

ConstantDefinition {
    setKeyword ConstantName expression
}

ConstantName { identifier }

expression {
    Number | string | Boolean
}

string {
    '"' StringContent '"'
}

Boolean {
  identifier
}

AuthorDefinition {
    authorKeyword string string string?
}

PaceDefinition {
    paceKeyword PaceDefinitionName "=" Pace
}

PaceDefinitionName { identifier }

intensity {
    percentage | PaceAlias
}

Pace {
    intensity ("->" intensity)?
}

percentage {
    Number "%"         // e.g., 60% or 5%
}

PaceAlias { identifier }  // a named pace, e.g., easy or hard

statement {
    instruction
    | ConstantDefinition
    | AuthorDefinition
    | PaceDefinition
}

instruction {
    SwimInstruction
    | RestInstruction
    | messageSpecification
    | ContinueInstruction
}

SwimInstruction {
    (Number repititionOperator)?
    (SingleInstruction | BlockInstruction) StrokeModifier? instructionModifier*
}

SingleInstruction {
    distance Stroke
}

distance { Number }

Stroke { identifier }

BlockInstruction {
    "{" instruction+ "}"
}

StrokeModifier { identifier }

Underwater {
    underwaterKeyword
}

instructionModifier {
    EquipmentSpecification
    | paceSpecification
    | timeSpecification
    | Underwater
    | Breathe
    | InstructionDescription
    | ExcludeAlignSpecification
}

ExcludeAlignSpecification {
    excludeAlignKeyword
}

InstructionDescription {
    "--" string
}

Breathe {
    breatheKeyword Number
}

EquipmentSpecification {
    "+" EquipmentName+
}

EquipmentName { identifier }

paceSpecification {
    "@" Pace
}

timeSpecification {
    onKeyword Duration
}

Duration {
    Number ":" Number    // minutes:seconds
}

RestInstruction {
    Duration restKeyword
}

messageSpecification {
  ">" Message
}

ContinueInstruction {
    (Number repititionOperator)? continueKeyword instructionModifier* "{" instruction+ "}"
}

@tokens {
    setKeyword            { "set" }
    authorKeyword         { "author" }
    paceKeyword           { "pace" }
    restKeyword           { "rest" }
    onKeyword             { "on" }
    underwaterKeyword     { "Underwater" }
    breatheKeyword        { "breathe" }
    continueKeyword { "continuous" }
    space       { @whitespace+ }
    Comment     { "#" ![\n]* }
    Number      { @digit+ }
    Message     { ![\n]+ }
    StringContent { (!["\\] | "\\" _)+ }
    identifier  { @asciiLetter+ }
    repititionOperator { "x" }
    excludeAlignKeyword { "noalign" }
    @precedence { StringContent, space }
    @precedence { StringContent, Comment }
    @precedence { repititionOperator, identifier }
    @precedence { paceKeyword, identifier }
    @precedence { setKeyword, identifier }
    @precedence { authorKeyword, identifier }
    @precedence { onKeyword, identifier }
    @precedence { space, Message }
    @precedence { Comment, Message }
    @precedence { excludeAlignKeyword, identifier }
    @precedence { excludeAlignKeyword, Message }
    @precedence { underwaterKeyword, identifier }
    @precedence { breatheKeyword, identifier }
    @precedence { continueKeyword, identifier }
}

@skip { space | Comment }
