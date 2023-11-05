import './App.css';
import React from 'react';

function useAsyncState(callback){
  const [state, setState] = React.useState(undefined);
  React.useEffect(()=>{
    let destructor = false;
    callback().then((data)=>{
      if (destructor) return;
      setState(data);
    });
    return ()=>{
      destructor = true;
    }
  }, [callback]);
  return [state, setState];
}

const fetchXML = ()=>fetch('WorldMap.html').then(
    (response)=>response.text());

function parseXML(xmlString){
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  const allUsableNodes = Array.from(doc.getElementsByTagName('g')).flatMap((gNode)=>Array.from(gNode.children));
  allUsableNodes.forEach((node, index)=>{
    if (node.tagName === 'polygon'){
        node.setAttribute('id', 'Russia');
        node.setAttribute('continent', 'Europe');
    }
    if (node.getAttribute('continent') === undefined || node.getAttribute('continent') === null)
        node.setAttribute('continent', 'Europe');
  });
  return allUsableNodes.map((node) => ({
    type: node.tagName,
    attributes: Object.fromEntries(Array.from(node.attributes).map((attr) => [attr.name, attr.value]))
  }));
}

const getNumbers = (obj)=>Math.max(...(Object.keys(obj).map((num)=>Number.parseInt(num))));

function ShowFacts({facts, visitedSets}){
    const [currentIdx, setCurrentIdx] = React.useState(getNumbers(visitedSets));
    React.useLayoutEffect(()=>{
        const newIndex = getNumbers(visitedSets);
        if (newIndex >= facts.length) return;
        setCurrentIdx(newIndex);
    }, [visitedSets]);
    return <div className={"fact-box"}>
        <div className>{facts.map((fact, index)=>{
            const status = visitedSets[index];
            const className = status === undefined ?  '' :
                status === 'incorrect' ?
                    '-bg-incorrect' : status === 'continent'
                        ? '-bg-continent' : '-bg-correct';
            return <button disabled={!Object.keys(visitedSets).includes(index.toString())} key={index} onClick={()=>setCurrentIdx(index)} className={`fact-button${className}`}/>

        })}</div>
        {facts[currentIdx]}
    </div>

}

/* Europe -- transform: scale(3) translateX(-1%) translateY(8%); /
  / North America -- transform: scale(2) translateX(25%) translateY(3%); /
  / South America -- transform: scale(2) translateX(18%) translateY(-20%); /
  / Africa -- transform: scale(2) translateX(-2%) translateY(-11%); /
  / Asia -- transform: scale(2.1) translateX(-19%) translateY(-3%); /
  / Oceania -- transform: scale(3) translateX(-33%) translateY(-22%); */

const mapTransform = {
    'Europe': 'europe',
    'North America': 'north-america',
    'South America': 'south-america',
    'Africa': 'africa',
    'Asia': 'asia',
    'Oceania': 'oceania',
    'Unknown': ''
}

function SVGMap({usableNodes, countryFacts, correct}){
  const [selectedCountry, setSelectedCountry] = React.useState({});
  const [visitedIndexes, setVisitedIndexes] = React.useState({0: undefined});


  const [position, setPosition] = React.useState(undefined);
    console.log(visitedIndexes)

  const hasCorrectContinent = Object.values(visitedIndexes).some((idx)=>idx === 'continent');
    const end = getNumbers(visitedIndexes) >= countryFacts.length || Object.values(visitedIndexes).some((idx)=>idx === 'country') ;
  console.log('correct continent', hasCorrectContinent)
  const correctCountryPaths = React.useMemo(()=>usableNodes.filter((node)=>node.attributes.id === correct.country), [correct, usableNodes]);
    return <>
    <div className={hasCorrectContinent ? mapTransform[correct.continent] : ''}  >
    <svg version={"1.1"} xmlns={"http://www.w3.org/2000/svg"} x={'0px'} y={'0px'} viewBox={"0 0 800 600"}>
    <g id={"World"}>
      {usableNodes.map((node, index)=>{
          const status = selectedCountry[node.attributes.id];
          return React.createElement(node.type, {
        ...node.attributes,
        key: index,
        onClick: ()=>{
            const newStatus = node.attributes.id === correct.country ? 'country' : node.attributes.continent === correct.continent ? 'continent' : 'incorrect';
        setSelectedCountry((prev)=>{
            if (node.id in prev) return prev;
            const nodeId = node.attributes.id;
            return {...prev, [nodeId]: newStatus}
        });
        setVisitedIndexes((prevState)=>{
            const currentMax = getNumbers(prevState);
            return {...prevState, [currentMax]: newStatus, [currentMax+1]: undefined};
        });
      },
        className: status === undefined ?  `sto-${Object.keys(mapTransform).findIndex((key)=>key===node.attributes.continent)}` : status === 'incorrect' ? 'st0-incorrect' : status === 'continent' ? 'st0-continent' : 'st0-correct',
        disabled: getNumbers(visitedIndexes) === countryFacts.length
      })})}
    </g>
  </svg>
  </div>
    <ShowFacts facts={countryFacts} visitedSets={visitedIndexes}/>
              {end && <div className={"dialog-window"} onClick={()=>window.location.reload()}>
          <div className={"dialog-box"} onClick={(event)=>event.stopPropagation()} >  <p className={
            Object.values(visitedIndexes).some((idx)=>idx==='country') ? 'win' :
            `loss`
          }> {
                Object.values(visitedIndexes).some((idx)=>idx==='country') ? 'Correct!' :
              `Incorrect`
              }</p>{
              Object.values(visitedIndexes).some((idx)=>idx==='country') ? `${correct.country} was correct!` :
              `Correct Answer was ${correct.country}`}
            </div>
        {
          /**
        <svg version={"1.1"} xmlns={"http://www.w3.org/2000/svg"} x={'0px'} y={'0px'} viewBox={"0 0 800 600"}>
            <g id="just_some_part">
                {correctCountryPaths.map((node, index)=>React.createElement(node.type, {
        ...node.attributes,
        key: index,
                 className: 'in-dialog-path',
        }))}
            </g>
        </svg>**/}
      </div>}
    </>;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const fetchCountry = async (countryName)=>{
  const response = await fetch(`http://localhost:8000/namePull/${countryName}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  return response.json();}

function App() {

  const [staticXML] = useAsyncState(fetchXML);
  const _usableNodes = React.useMemo(()=>staticXML === undefined ? undefined : parseXML(staticXML), [staticXML]);
 const usableNodes = React.useMemo(()=>_usableNodes?.map((node)=>({...node, attributes: {...node.attributes, id: node.attributes.id === undefined ? 'Russia' : node.attributes.id}})), [_usableNodes])
  const [correctCountry, setCorrectCountry] = React.useState(undefined);
 React.useLayoutEffect(()=>{
    if (usableNodes === undefined) return;
    const distinct = Array.from(new Set(usableNodes.map((usableNode)=>usableNode.attributes.id).filter((id)=>id !== 'Unknown')).keys());
    const _country = distinct[getRandomInt(distinct.length)];
    const continent = usableNodes.find((node)=>node.attributes.id === _country).attributes.continent;

    setCorrectCountry({
        country: _country,
        continent
    });
  }, [usableNodes]);
 console.log(correctCountry)
  const [countryFacts] = useAsyncState(React.useCallback(()=>correctCountry === undefined ? Promise.resolve(undefined): fetchCountry(correctCountry.country), [correctCountry]));
  return (
    <div>
      {countryFacts === undefined ?
          null :
          usableNodes && <SVGMap usableNodes={usableNodes} countryFacts={countryFacts} correct={correctCountry}/>}
    </div>
  );
}



export default App;
